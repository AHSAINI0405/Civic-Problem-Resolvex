const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');
const Department = require('../models/Department');
const asyncHandler = require('../middleware/asyncHandler');
const aiService = require('../services/aiService');
const socketService = require('../services/socketService');
const emailService = require('../services/emailService');
const User = require('../models/User');

const SLA_DAYS = { critical: 1, high: 3, medium: 7, low: 14 };

// Helper: add timeline entry
const addTimeline = (complaint, status, message, userId) => {
  complaint.timeline.push({ status, message, updatedBy: userId, updatedAt: new Date() });
};

// @desc    Raise a new complaint
// @route   POST /api/complaints
exports.createComplaint = asyncHandler(async (req, res) => {
  const { title, description, isAnonymous, address } = req.body;
  let { lat, lng } = req.body;
  lat = parseFloat(lat) || 0;
  lng = parseFloat(lng) || 0;

  // AI classification
  const ai = await aiService.classifyComplaint(title, description);

  // Handle uploaded files (support Cloudinary and local disk fallback)
  const images = (req.files?.images || []).map((f) => {
    const isCloudinary = f.path && (f.path.startsWith('http://') || f.path.startsWith('https://'));
    return {
      url: isCloudinary ? f.path : `/uploads/${f.filename}`,
      publicId: f.filename || f.public_id,
    };
  });
  const videos = (req.files?.videos || []).map((f) => {
    const isCloudinary = f.path && (f.path.startsWith('http://') || f.path.startsWith('https://'));
    return {
      url: isCloudinary ? f.path : `/uploads/${f.filename}`,
      publicId: f.filename || f.public_id,
    };
  });

  const slaDeadline = new Date();
  slaDeadline.setDate(slaDeadline.getDate() + (SLA_DAYS[ai.priority] || 7));

  const complaint = await Complaint.create({
    title,
    description,
    category: ai.category,
    priority: ai.priority,
    aiSuggestion: { category: ai.category, priority: ai.priority, confidence: ai.confidence, reason: ai.reason },
    isSpam: ai.isSpam,
    spamReason: ai.spamReason,
    location: { type: 'Point', coordinates: [lng, lat], address: address || '' },
    images,
    videos,
    user: req.user._id,
    isAnonymous: !!isAnonymous,
    status: 'pending',
    slaDeadline,
    timeline: [{ status: 'pending', message: 'Complaint submitted successfully.', updatedBy: req.user._id, updatedAt: new Date() }],
  });

  const populated = await complaint.populate('user', 'name email avatar notificationPrefs');
  socketService.alertAdmin({ complaint: populated, message: 'New complaint received!' });

  if (populated.user) {
    if (populated.user.notificationPrefs?.email) {
      emailService.sendComplaintRegistrationEmail(
        populated.user.email,
        populated.user.name,
        populated.title,
        populated.category,
        populated.priority
      ).catch(err => console.error('Error sending complaint registration email:', err));
    }
  }

  res.status(201).json({ success: true, complaint: populated, aiSuggestion: ai });
});

// @desc    Get all complaints (role-filtered)
// @route   GET /api/complaints
exports.getComplaints = asyncHandler(async (req, res) => {
  const { status, category, priority, search, page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const filter = {};

  if (req.user.role === 'citizen') filter.user = req.user._id;
  else if (req.user.role === 'department') filter.assignedTo = req.user.department;

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

  const skip = (page - 1) * limit;
  const [complaints, total] = await Promise.all([
    Complaint.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate('user', 'name avatar').populate('assignedTo', 'name'),
    Complaint.countDocuments(filter),
  ]);

  res.json({ success: true, complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc    Get single complaint with comments
// @route   GET /api/complaints/:id
exports.getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name avatar email')
    .populate('assignedTo', 'name email phone')
    .populate('timeline.updatedBy', 'name role');

  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  const comments = await Comment.find({ complaint: complaint._id })
    .populate('user', 'name avatar role')
    .sort('createdAt');

  res.json({ success: true, complaint, comments });
});

// @desc    Update complaint status (admin/dept)
// @route   PUT /api/complaints/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const complaint = await Complaint.findById(req.params.id).populate('user', 'name email notificationPrefs');

  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  complaint.status = status;
  if (remarks) complaint.departmentRemarks = remarks;
  if (status === 'resolved') complaint.resolvedAt = new Date();

  addTimeline(complaint, status, remarks || `Status updated to ${status}`, req.user._id);
  await complaint.save();

  // Notify citizen
  if (complaint.user) {
    await socketService.createNotification({
      userId: complaint.user._id,
      title: `Complaint ${status.replace('_', ' ')}`,
      message: `Your complaint "${complaint.title}" is now ${status.replace('_', ' ')}.`,
      type: 'status_update',
      complaintId: complaint._id,
    }).catch(err => console.error('Error creating status update socket notification:', err));

    if (complaint.user.notificationPrefs?.email) {
      emailService.sendStatusUpdateEmail(complaint.user.email, complaint.user.name, complaint.title, status)
        .catch(err => console.error('Error sending status update email:', err));
    }
  }

  socketService.emitStatusUpdate(complaint._id, { status, complaintId: complaint._id });
  res.json({ success: true, complaint });
});

// @desc    Assign complaint to department (admin)
// @route   PUT /api/complaints/:id/assign
exports.assignComplaint = asyncHandler(async (req, res) => {
  const { departmentId } = req.body;
  const dept = await Department.findById(departmentId);
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });

  const complaint = await Complaint.findById(req.params.id).populate('user', 'name email notificationPrefs');
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  complaint.assignedTo = departmentId;
  complaint.status = 'assigned';
  complaint.assignedAt = new Date();
  addTimeline(complaint, 'assigned', `Assigned to ${dept.name}`, req.user._id);
  await complaint.save();

  dept.totalAssigned += 1;
  await dept.save();

  // Notify dept users
  const deptUsers = await User.find({ department: departmentId, role: 'department' });
  for (const du of deptUsers) {
    await socketService.createNotification({
      userId: du._id,
      title: 'New Complaint Assigned',
      message: `Complaint "${complaint.title}" has been assigned to your department.`,
      type: 'assignment',
      complaintId: complaint._id,
    });
  }

  // Notify citizen (assigned)
  if (complaint.user) {
    await socketService.createNotification({
      userId: complaint.user._id,
      title: 'Complaint Assigned',
      message: `Your complaint "${complaint.title}" has been assigned to a department.`,
      type: 'status_update',
      complaintId: complaint._id,
    }).catch(err => console.error('Error creating assignment socket notification:', err));

    if (complaint.user.notificationPrefs?.email) {
      await emailService.sendStatusUpdateEmail(
        complaint.user.email,
        complaint.user.name,
        complaint.title,
        'assigned'
      ).catch(err => console.error('Error sending assignment email:', err));
    }
  }

  res.json({ success: true, complaint });
});


// @desc    Upvote a complaint
// @route   POST /api/complaints/:id/upvote
exports.upvoteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  const userId = req.user._id.toString();
  const alreadyUpvoted = complaint.upvotes.map((u) => u.toString()).includes(userId);

  if (alreadyUpvoted) {
    complaint.upvotes = complaint.upvotes.filter((u) => u.toString() !== userId);
    complaint.upvoteCount = Math.max(0, complaint.upvoteCount - 1);
  } else {
    complaint.upvotes.push(req.user._id);
    complaint.upvoteCount += 1;
  }

  await complaint.save();
  res.json({ success: true, upvoted: !alreadyUpvoted, upvoteCount: complaint.upvoteCount });
});

// @desc    Add comment to complaint
// @route   POST /api/complaints/:id/comment
exports.addComment = asyncHandler(async (req, res) => {
  const { text, isAnonymous } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  const comment = await Comment.create({ complaint: req.params.id, user: req.user._id, text, isAnonymous: !!isAnonymous });
  const populated = await comment.populate('user', 'name avatar role');

  // Notify complaint owner
  if (complaint.user.toString() !== req.user._id.toString()) {
    await socketService.createNotification({
      userId: complaint.user,
      title: 'New Comment',
      message: `Someone commented on your complaint "${complaint.title}".`,
      type: 'comment',
      complaintId: complaint._id,
    });
  }

  res.status(201).json({ success: true, comment: populated });
});

// @desc    Get nearby complaints
// @route   GET /api/complaints/nearby?lat=&lng=&radius=
exports.getNearby = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required.' });

  const complaints = await Complaint.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: Number(radius),
      },
    },
    status: { $ne: 'resolved' },
  })
    .limit(50)
    .select('title category priority status location upvoteCount createdAt');

  res.json({ success: true, complaints });
});

// @desc    Get heatmap data
// @route   GET /api/complaints/heatmap
exports.getHeatmap = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ 'location.coordinates': { $ne: [0, 0] } })
    .select('location category priority status')
    .limit(500);

  const points = complaints.map((c) => ({
    lat: c.location.coordinates[1],
    lng: c.location.coordinates[0],
    category: c.category,
    priority: c.priority,
    status: c.status,
  }));

  res.json({ success: true, points });
});
