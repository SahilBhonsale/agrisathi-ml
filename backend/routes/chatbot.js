const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const ChatSession = require('../models/ChatSession');

// Simple response function for testing (we'll replace this with Gemini later)
const getSimpleResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm AgriSathi AI, your agricultural assistant. How can I help you with farming today?";
  }
  
  if (lowerMessage.includes('soil')) {
    return "For healthy soil: \n• Test pH levels (6.0-7.0 is ideal)\n• Add organic compost\n• Ensure proper drainage\n• Avoid over-tilling\n\nWhat specific soil issue are you facing?";
  }
  
  if (lowerMessage.includes('pest')) {
    return "For pest control:\n• Use beneficial insects\n• Try neem oil spray\n• Practice crop rotation\n• Use companion planting\n• Avoid excessive pesticides\n\nWhat pests are troubling your crops?";
  }
  
  if (lowerMessage.includes('water')) {
    return "Watering tips:\n• Most crops need 1-2 inches per week\n• Water deeply but less frequently\n• Consider drip irrigation\n• Water early morning or evening\n\nWhat crops are you watering?";
  }
  
  if (lowerMessage.includes('fertilizer')) {
    return "Fertilizer guidance:\n• Test soil first\n• NPK ratios vary by growth stage\n• Organic options: compost, manure\n• Follow package instructions\n\nWhat crops need fertilizing?";
  }

  if (lowerMessage.includes('disease')) {
    return "Disease management:\n• Early detection is key\n• Remove affected parts\n• Improve air circulation\n• Use disease-resistant varieties\n• Apply fungicides if needed\n\nDescribe the symptoms you're seeing?";
  }

  if (lowerMessage.includes('harvest')) {
    return "Harvest timing:\n• Check crop maturity indicators\n• Consider weather conditions\n• Harvest at optimal moisture\n• Use proper storage techniques\n\nWhich crop are you planning to harvest?";
  }
  
  return "I'm here to help with all your agricultural questions! Ask me about:\n• Crop cultivation\n• Soil management\n• Pest control\n• Irrigation\n• Fertilizers\n• Disease management\n• Harvesting\n\nWhat farming challenge can I help you with?";
};

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Get conversation history
router.get('/history', authenticate, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ user: req.user._id }).lean();
    const history = session?.messages || [];
    
    res.json({
      success: true,
      data: history.slice(-20) // Return last 20 messages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
});

// Send message to AI
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id.toString();

    console.log('📨 Received message from user:', userId, 'Message:', message);

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get user's conversation history
    const session = await ChatSession.findOneAndUpdate(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id } },
      { new: true, upsert: true }
    );
    let conversationHistory = session.messages.map((item) => item.toObject());
    
    // Add user message to history
    const userMessage = {
      from: 'user',
      text: message.trim(),
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(userMessage);

    // Generate response using Gemini AI
    console.log('🤖 Generating Gemini AI response...');
    const aiResult = await geminiService.generateResponse(message, conversationHistory);
    
    let responseText = aiResult.response;
    let isError = !aiResult.success;
    
    if (aiResult.error) {
      console.log('⚠️ Gemini API Error, using fallback:', aiResult.error);
    }

    // Create bot message
    const botMessage = {
      from: 'bot',
      text: responseText,
      timestamp: new Date().toISOString(),
      isError: isError,
      model: aiResult.model || 'unknown'
    };
    conversationHistory.push(botMessage);

    // Limit conversation history (keep last 50 messages)
    if (conversationHistory.length > 50) {
      conversationHistory = conversationHistory.slice(-50);
    }

    session.messages = conversationHistory;
    await session.save();

    console.log(`✅ Response generated using ${aiResult.model || 'fallback'}`);

    res.json({
      success: true,
      data: {
        userMessage,
        botMessage,
        conversationId: userId,
        aiModel: aiResult.model || 'fallback'
      }
    });

  } catch (error) {
    console.error('❌ Chatbot Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      data: {
        botMessage: {
          from: 'bot',
          text: '🔧 Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true
        }
      }
    });
  }
});

// Clear conversation history
router.delete('/history', authenticate, async (req, res) => {
  try {
    await ChatSession.deleteOne({ user: req.user._id });
    
    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
});

// Get AI status and capabilities
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'online',
        model: process.env.GEMINI_API_KEY ? 'Google Gemini' : 'Offline knowledge base',
        capabilities: [
          'Crop cultivation advice',
          'Pest and disease management',
          'Soil health guidance',
          'Weather and seasonal tips',
          'Agricultural equipment info',
          'Organic farming practices',
          'Government schemes',
          'Market trend analysis',
          'Advanced AI conversations',
          'Context-aware farming advice',
          'Indian agricultural practices',
          'Sustainable agriculture guidance'
        ],
        languages: ['English', 'Hindi (Limited)'],
        provider: process.env.GEMINI_API_KEY ? 'Google Generative AI' : 'AgriSathi built-in guidance',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status'
    });
  }
});

module.exports = router;
