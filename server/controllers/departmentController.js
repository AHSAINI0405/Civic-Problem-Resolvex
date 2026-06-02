const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const asyncHandler = require('../middleware/asyncHandler');
const socketService = require('../services/socketService');

const addTimeline = (complaint, status, message, userId) => {
  complaint.timeline.push({ status, message, updatedBy: userId, updatedAt: new Date() });
};

// @desc  Get assigned complaints for dept
// @route GET /api/department/assigned
exports.getAssigned = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 12 } = req.query;
  const filter = { assignedTo: req.user.department };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [complaints, total] = await Promise.all([
    Complaint.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).populate('user', 'name avatar'),
    Complaint.countDocuments(filter),
  ]);
  res.json({ success: true, complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc  Accept a complaint
// @route PUT /api/department/complaints/:id/accept
exports.acceptComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  complaint.status = 'in_progress';
  addTimeline(complaint, 'in_progress', 'Department accepted and started working on this complaint.', req.user._id);
  await complaint.save();
  await socketService.createNotification({ userId: complaint.user, title: 'Complaint Accepted', message: `Your complaint "${complaint.title}" is now being worked on.`, type: 'status_update', complaintId: complaint._id });
  res.json({ success: true, complaint });
});

// @desc  Reject a complaint
// @route PUT /api/department/complaints/:id/reject
exports.rejectComplaint = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  complaint.status = 'rejected';
  complaint.departmentRemarks = reason || 'Rejected by department.';
  addTimeline(complaint, 'rejected', reason || 'Rejected by department.', req.user._id);
  await complaint.save();
  res.json({ success: true, complaint });
});

// @desc  Mark in progress with remarks
// @route PUT /api/department/complaints/:id/progress
exports.updateProgress = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  complaint.departmentRemarks = remarks || complaint.departmentRemarks;
  addTimeline(complaint, 'in_progress', remarks || 'Progress update from department.', req.user._id);
  const proofImages = (req.files || []).map(f => ({ url: `/uploads/${f.filename}`, publicId: f.filename }));
  if (proofImages.length) complaint.proofImages.push(...proofImages);
  await complaint.save();
  res.json({ success: true, complaint });
});

// @desc  Mark complaint as resolved
// @route PUT /api/department/complaints/:id/complete
exports.completeComplaint = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  complaint.status = 'resolved';
  complaint.resolvedAt = new Date();
  complaint.departmentRemarks = remarks || 'Issue resolved by department.';
  addTimeline(complaint, 'resolved', remarks || 'Issue has been resolved.', req.user._id);
  await complaint.save();

  // Update dept stats
  if (complaint.assignedTo) {
    const dept = await Department.findById(complaint.assignedTo);
    if (dept) {
      dept.totalResolved += 1;
      const days = complaint.resolvedAt && complaint.assignedAt
        ? Math.ceil((complaint.resolvedAt - complaint.assignedAt) / 86400000) : 0;
      dept.avgResolutionDays = dept.totalResolved > 1
        ? Math.round((dept.avgResolutionDays * (dept.totalResolved - 1) + days) / dept.totalResolved) : days;
      await dept.save();
    }
  }

  await socketService.createNotification({ userId: complaint.user, title: 'Complaint Resolved! 🎉', message: `Your complaint "${complaint.title}" has been resolved.`, type: 'status_update', complaintId: complaint._id });
  res.json({ success: true, complaint });
});

// @desc  Dept performance stats
// @route GET /api/department/performance
exports.getPerformance = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.user.department);
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
  const [total, pending, inProgress, resolved, slaBreached] = await Promise.all([
    Complaint.countDocuments({ assignedTo: dept._id }),
    Complaint.countDocuments({ assignedTo: dept._id, status: { $in: ['assigned', 'pending'] } }),
    Complaint.countDocuments({ assignedTo: dept._id, status: 'in_progress' }),
    Complaint.countDocuments({ assignedTo: dept._id, status: 'resolved' }),
    Complaint.countDocuments({ assignedTo: dept._id, slaBreached: true }),
  ]);
  res.json({ success: true, department: dept, stats: { total, pending, inProgress, resolved, slaBreached } });
});
