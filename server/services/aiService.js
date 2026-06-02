const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock');

const CATEGORIES = ['roads', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'noise', 'animals', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const mockClassify = (title, description) => {
  const text = (title + ' ' + description).toLowerCase();
  let category = 'other';
  let priority = 'medium';
  let isSpam = false;
  let spamReason = '';
  let confidence = 0.85;

  if (text.includes('spam') || text.includes('casino') || text.includes('buy lottery') || text.includes('lorem ipsum')) {
    isSpam = true;
    spamReason = 'Contains keywords typically associated with spam or test messages.';
    confidence = 0.95;
  }

  if (text.includes('road') || text.includes('pothole') || text.includes('street')) category = 'roads';
  else if (text.includes('water') || text.includes('pipe') || text.includes('flood')) category = 'water';
  else if (text.includes('electric') || text.includes('power') || text.includes('light')) category = 'electricity';
  else if (text.includes('garbage') || text.includes('waste') || text.includes('sewage')) category = 'sanitation';
  else if (text.includes('noise') || text.includes('loud')) category = 'noise';
  else if (text.includes('park') || text.includes('garden')) category = 'parks';
  else if (text.includes('animal') || text.includes('dog') || text.includes('stray')) category = 'animals';
  else if (text.includes('crime') || text.includes('theft') || text.includes('danger')) { category = 'public_safety'; priority = 'high'; }

  if (text.includes('urgent') || text.includes('emergency') || text.includes('critical')) priority = 'critical';
  else if (text.includes('severe') || text.includes('serious') || text.includes('major')) priority = 'high';

  return {
    category,
    priority,
    confidence,
    reason: `Identified key terms relating to ${category.replace('_', ' ')} department.`,
    suggestion: `Please include specific street addresses or landmarks to help the ${category.replace('_', ' ')} team resolve this quickly.`,
    isSpam,
    spamReason
  };
};

/**
 * Classify complaint text using Gemini AI
 */
exports.classifyComplaint = async (title, description) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return mockClassify(title, description);
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an AI assistant for a civic complaint management system. Analyze the following complaint and respond ONLY with a valid JSON object.

Complaint Title: "${title}"
Complaint Description: "${description}"

Respond with this exact JSON format (no markdown, no extra text):
{
  "category": "<one of: ${CATEGORIES.join(', ')}>",
  "priority": "<one of: ${PRIORITIES.join(', ')}>",
  "confidence": <number 0-1>,
  "reason": "<brief reason for classification>",
  "suggestion": "<helpful tip for the citizen, max 100 chars>",
  "isSpam": <true or false>,
  "spamReason": "<reason if spam, else empty string>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      category: CATEGORIES.includes(parsed.category?.toLowerCase()) ? parsed.category.toLowerCase() : 'other',
      priority: PRIORITIES.includes(parsed.priority?.toLowerCase()) ? parsed.priority.toLowerCase() : 'medium',
      confidence: parsed.confidence || 0.8,
      reason: parsed.reason || '',
      suggestion: parsed.suggestion || '',
      isSpam: !!parsed.isSpam,
      spamReason: parsed.spamReason || '',
    };
  } catch (err) {
    console.error('Gemini classify error:', err.message);
    return mockClassify(title, description);
  }
};

/**
 * Get smart typing suggestions
 */
exports.getSmartSuggestion = async (partialText) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    const text = partialText.toLowerCase();
    if (text.includes('road') || text.includes('pothole')) return 'Looks like a road/infrastructure issue. Mention the exact location and severity.';
    if (text.includes('water')) return 'Looks like a water supply issue. Mention how long it has been affecting your area.';
    if (text.includes('garbage')) return 'Looks like a sanitation issue. Mention how often waste is not collected.';
    return 'Provide specific details including location and how long this issue has persisted.';
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `A citizen is typing a civic complaint: "${partialText}". Give ONE short, helpful suggestion (max 120 chars) to help them describe the issue better. Respond with just the suggestion text, no JSON, no quotes.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().slice(0, 150);
  } catch {
    return 'Add more details like location, duration, and severity for faster resolution.';
  }
};

/**
 * AI Chatbot for complaint assistance
 */
exports.chatbot = async (messages) => {
  const systemPrompt = `You are ResolvexBot, an AI assistant for the Resolvex complaint management platform. Help citizens:
1. File complaints correctly (ask for category, location, description)
2. Understand complaint statuses and processes
3. Check what department handles their issue
4. Provide civic information

Be friendly, concise, and always guide them to file a complaint if they have an issue. Keep responses under 150 words.`;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Quick options
    if (lastMsg === 'how do i file a complaint?') return "To file a complaint, click on the 'Raise Complaint' button. You'll need to provide details like a title, description, category, and your location on the map. You can also upload photos! 📝";
    if (lastMsg === 'what issues can i report?') return "You can report issues related to roads, water, electricity, sanitation, public safety, parks, noise, and stray animals. 🏛️";
    if (lastMsg === 'how long does resolution take?') return "Resolution time depends on the priority level. Critical issues are usually addressed within 24 hours, while low-priority issues may take up to 2 weeks. ⏱️";
    if (lastMsg === 'can i track my complaint?' || lastMsg.includes('status')) return "You can track your complaint status in 'My Complaints'. Statuses go: Pending → Assigned → In Progress → Resolved. You'll get email notifications for each update! 📧";

    // Keywords
    if (lastMsg.includes('road') || lastMsg.includes('pothole')) return "It sounds like a road issue! I'll help you file it with the Roads & Infrastructure department. Click 'Raise Complaint', select 'Roads' as the category, and describe the exact location and problem. 🚧";
    if (lastMsg.includes('water')) return "Water supply issues are handled by the Water Department. Please raise a complaint with your area details and how long the issue has been occurring. 💧";
    if (lastMsg.includes('electric') || lastMsg.includes('power')) return "Electricity issues like power outages or broken streetlights are handled by the Electricity Board. Please file a complaint and select 'Electricity' as the category. ⚡";
    if (lastMsg.includes('garbage') || lastMsg.includes('waste')) return "For garbage and waste collection issues, please file a complaint under the 'Sanitation' category. 🗑️";
    
    return "Hi! I'm ResolvexBot 🤖. I can help you file civic complaints, check statuses, or understand our process. What issue are you facing today?";
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt 
    });
    
    const historyCleaned = messages.slice(0, -1);
    while (historyCleaned.length > 0 && historyCleaned[0].role !== 'user') {
      historyCleaned.shift();
    }

    const chat = model.startChat({
      history: historyCleaned.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 256 },
    });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini chatbot error:', err.message);
    return "I'm having trouble connecting right now. Please try raising a complaint directly using the 'Raise Complaint' button. 🏛️";
  }
};
