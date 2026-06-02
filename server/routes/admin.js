const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/analytics', ctrl.getAnalytics);
router.get('/complaints', ctrl.getAllComplaints);
router.get('/sla', ctrl.getSLA);

router.get('/users', ctrl.getUsers);
router.put('/users/:id/block', ctrl.toggleBlock);
router.post('/users/department', ctrl.createDepartmentUser);

router.route('/departments')
  .get(ctrl.getDepartments)
  .post(ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);
router.get('/departments/:id/users', ctrl.getDepartmentUsers);

module.exports = router;
