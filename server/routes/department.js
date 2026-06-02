const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('department'));

router.get('/assigned', ctrl.getAssigned);
router.get('/performance', ctrl.getPerformance);
router.put('/complaints/:id/accept', ctrl.acceptComplaint);
router.put('/complaints/:id/reject', ctrl.rejectComplaint);
router.put('/complaints/:id/progress', upload.array('proofImages', 5), ctrl.updateProgress);
router.put('/complaints/:id/complete', ctrl.completeComplaint);

module.exports = router;
