const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/classify', ctrl.classify);
router.post('/suggest', ctrl.suggest);
router.post('/chatbot', ctrl.chatbot);

module.exports = router;
