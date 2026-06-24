const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'test');
try {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite',
    systemInstruction: "You are a helpful assistant"
  });
  console.log("Model created with systemInstruction");
} catch (e) {
  console.error(e);
}
