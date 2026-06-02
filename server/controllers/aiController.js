const asyncHandler = require('../middleware/asyncHandler');
const aiService = require('../services/aiService');

// @desc  Classify complaint text
// @route POST /api/ai/classify
exports.classify = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ success: false, message: 'title and description required.' });
  const result = await aiService.classifyComplaint(title, description);
  res.json({ success: true, ...result });
});

// @desc  Get smart suggestion while typing
// @route POST /api/ai/suggest
exports.suggest = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ success: true, suggestion: '' });
  const suggestion = await aiService.getSmartSuggestion(text);
  res.json({ success: true, suggestion });
});

// @desc  AI Chatbot
// @route POST /api/ai/chatbot
exports.chatbot = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'messages array required.' });
  }
  const reply = await aiService.chatbot(messages);
  res.json({ success: true, reply });
});
