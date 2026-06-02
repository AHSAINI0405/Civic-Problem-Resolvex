const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Admin dashboard summary
// @route   GET /api/admin/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const [total, pending, assigned, inProgress, resolved, rejected, totalUsers, departments] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: 'pending' }),
    Complaint.countDocuments({ status: 'assigned' }),
    Complaint.countDocuments({ status: 'in_progress' }),
    Complaint.countDocuments({ status: 'resolved' }),
    Complaint.countDocuments({ status: 'rejected' }),
    User.countDocuments({ role: 'citizen' }),
    Department.countDocuments(),
  ]);

  const recentComplaints = await Complaint.find()
    .sort('-createdAt')
    .limit(8)
    .populate('user', 'name avatar')
    .populate('assignedTo', 'name');

  const slaBreached = await Complaint.countDocuments({ slaBreached: true, status: { $nin: ['resolved', 'rejected'] } });

  res.json({ success: true, stats: { total, pending, assigned, inProgress, resolved, rejected, totalUsers, departments, slaBreached }, recentComplaints });
});

// @desc    Analytics data
// @route   GET /api/admin/analytics
exports.getAnalytics = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [categoryData, monthlyTrend, statusData, priorityData, deptPerformance] = await Promise.all([
    Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Department.find().select('name totalAssigned totalResolved avgResolutionDays slaBreach'),
  ]);

  res.json({ success: true, categoryData, monthlyTrend, statusData, priorityData, deptPerformance });
});

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort('-createdAt').populate('department', 'name'),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total });
});

// @desc    Block/unblock user
// @route   PUT /api/admin/users/:id/block
exports.toggleBlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot block an admin.' });
  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, isBlocked: user.isBlocked });
});

// @desc    Create department user
// @route   POST /api/admin/users/department
exports.createDepartmentUser = asyncHandler(async (req, res) => {
  const { name, email, password, departmentId } = req.body;
  const dept = await Department.findById(departmentId);
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
  const user = await User.create({ name, email, password, role: 'department', department: departmentId, isVerified: true });
  res.status(201).json({ success: true, user });
});

// @desc    Get all departments
// @route   GET /api/admin/departments
exports.getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort('name');
  res.json({ success: true, departments });
});

// @desc    Create department
// @route   POST /api/admin/departments
exports.createDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.create(req.body);
  res.status(201).json({ success: true, department: dept });
});

// @desc    Update department
// @route   PUT /api/admin/departments/:id
exports.updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
  res.json({ success: true, department: dept });
});

// @desc    SLA tracking
// @route   GET /api/admin/sla
exports.getSLA = asyncHandler(async (req, res) => {
  const now = new Date();
  const [breached, atRisk] = await Promise.all([
    Complaint.find({ status: { $nin: ['resolved', 'rejected'] }, slaDeadline: { $lt: now } }).populate('user', 'name').populate('assignedTo', 'name').sort('slaDeadline'),
    Complaint.find({ status: { $nin: ['resolved', 'rejected'] }, slaDeadline: { $gte: now, $lte: new Date(now.getTime() + 86400000) } }).populate('user', 'name').populate('assignedTo', 'name'),
  ]);
  res.json({ success: true, breached, atRisk });
});

// @desc    Get all complaints (admin)
// @route   GET /api/admin/complaints
exports.getAllComplaints = asyncHandler(async (req, res) => {
  const { status, category, priority, department, search, page = 1, limit = 15, sort = '-createdAt' } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (department) filter.assignedTo = department;
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
  const skip = (page - 1) * limit;
  const [complaints, total] = await Promise.all([
    Complaint.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate('user', 'name avatar email').populate('assignedTo', 'name'),
    Complaint.countDocuments(filter),
  ]);
  res.json({ success: true, complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc    Get all users belonging to a department
// @route   GET /api/admin/departments/:id/users
exports.getDepartmentUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'department', department: req.params.id }).select('name email lastLogin isBlocked');
  res.json({ success: true, users });
});
