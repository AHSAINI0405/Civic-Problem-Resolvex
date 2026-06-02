const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public nearby/heatmap (still needs login)
router.get('/nearby', protect, ctrl.getNearby);
router.get('/heatmap', protect, ctrl.getHeatmap);

router.route('/')
  .get(protect, ctrl.getComplaints)
  .post(protect, authorize('citizen'), upload.fields([{ name: 'images', maxCount: 5 }, { name: 'videos', maxCount: 2 }]), ctrl.createComplaint);

router.route('/:id')
  .get(protect, ctrl.getComplaint);

router.put('/:id/status', protect, authorize('admin', 'department'), ctrl.updateStatus);
router.put('/:id/assign', protect, authorize('admin'), ctrl.assignComplaint);
router.post('/:id/upvote', protect, ctrl.upvoteComplaint);
router.post('/:id/comment', protect, ctrl.addComment);

module.exports = router;
