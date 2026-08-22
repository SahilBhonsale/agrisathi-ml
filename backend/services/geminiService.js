const { GoogleGenAI } = require('@google/genai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn(' GEMINI_API_KEY is not configured, fallback responses will be used');
      this.apiConfigured = false;
    } else {
      this.apiConfigured = true;
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Stable current models, ordered for quality first and lower-cost fallback second.
      this.modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
    }
    
    // Agriculture-specific system prompt
    this.systemPrompt = `You are AgriSathi AI, an expert agricultural assistant specialized in helping farmers and agricultural enthusiasts. You have deep knowledge about:

1. Crop cultivation and farming techniques
2. Pest and disease management
3. Soil health and fertilizers
4. Weather patterns and seasonal advice
5. Agricultural equipment and tools
6. Organic farming practices
7. Market trends and crop pricing
8. Government schemes for farmers
9. Sustainable agriculture
10. Plant care and gardening

Guidelines for responses:
- Provide practical, actionable advice
- Consider Indian agricultural conditions and practices
- Be encouraging and supportive
- Use simple, farmer-friendly language
- Include safety warnings when discussing chemicals/pesticides
- Suggest sustainable and eco-friendly solutions when possible
- If unsure about specific medical/chemical advice, recommend consulting experts
- Keep responses concise but comprehensive
- Use emojis to make responses more engaging

Always respond in a helpful, knowledgeable, and encouraging manner. If the question is not related to agriculture, politely redirect the conversation back to farming topics.`;
  }

  async generateResponse(userMessage, conversationHistory = []) {
    // Check if API is configured
    if (!this.apiConfigured) {
      console.warn('Gemini API not configured, using fallback response');
      return {
        success: true,
        response: this.getFallbackResponse(userMessage),
        error: null,
        model: 'fallback'
      };
    }

    // Prepare the conversation context
    let fullPrompt = this.systemPrompt + "\n\n";
    
    // Add conversation history for context
    if (conversationHistory.length > 0) {
      fullPrompt += "Previous conversation:\n";
      conversationHistory.slice(-6).forEach(msg => { // Last 6 messages for context
        fullPrompt += `${msg.from === 'user' ? 'User' : 'AgriSathi AI'}: ${msg.text}\n`;
      });
      fullPrompt += "\n";
    }
    
    fullPrompt += `Current user question: ${userMessage}\n\nPlease provide a helpful response:`;

    // Try each model in the fallback chain
    let lastError = null;
    for (const modelName of this.modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}...`);
        const response = await this.genAI.models.generateContent({
          model: modelName,
          contents: fullPrompt
        });
        const text = response.text?.trim();

        if (!text) {
          throw new Error('Gemini returned an empty response');
        }
        
        console.log(`✅ Success with model: ${modelName}`);
        return {
          success: true,
          response: text,
          model: modelName,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        lastError = error;
        console.error(`❌ Model ${modelName} failed:`, error.message);
        // Continue to next model
      }
    }

    // All models failed — use fallback response instead of showing an error
    console.warn('⚠️ All Gemini models failed, using built-in fallback response');
    return {
      success: false,
      response: this.getFallbackResponse(userMessage),
      model: 'fallback',
      error: lastError?.message || 'All configured Gemini models failed',
      timestamp: new Date().toISOString()
    };
  }

  // Pre-built responses for common queries
  getQuickResponses() {
    return {
      greeting: [
        "🌱 Hello! I'm AgriSathi AI, your agricultural assistant. How can I help you with farming today?",
        "🚜 Welcome to AgriSathi! I'm here to help with all your agricultural questions. What would you like to know?",
        "🌾 Hi there! Ready to talk about farming, crops, or agriculture? Ask me anything!"
      ],
      help: [
        "🌿 I can help you with:\n• Crop cultivation advice\n• Pest and disease management\n• Soil and fertilizer guidance\n• Weather and seasonal tips\n• Agricultural equipment info\n• Organic farming practices\n• Government schemes\n• Market trends\n\nWhat would you like to know about?",
        "📚 I'm your agricultural knowledge companion! Ask me about crops, farming techniques, pest control, soil health, equipment, or any farming challenges you're facing."
      ],
      weather: "🌤️ For current weather information, I recommend checking local weather services. However, I can provide general seasonal farming advice based on weather patterns!",
      market: "📊 For real-time market prices, check government agricultural portals or local mandis. I can help you understand market trends and factors affecting crop prices though!"
    };
  }

  // Analyze user intent for better responses
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greeting';
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return 'help';
    }
    if (lowerMessage.includes('weather') || lowerMessage.includes('climate')) {
      return 'weather';
    }
    if (lowerMessage.includes('price') || lowerMessage.includes('market') || lowerMessage.includes('sell')) {
      return 'market';
    }
    
    return 'general';
  }

  // Fallback response when API is not available
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "🌱 Hello! I'm AgriSathi AI, your agricultural assistant. How can I help you with farming today?";
    }
    if (lowerMessage.includes('soil')) {
      return "🌍 For healthy soil:\n• Test pH levels (6.0-7.0 is ideal for most crops)\n• Add organic compost regularly\n• Ensure proper drainage\n• Avoid over-tilling\n• Practice crop rotation to maintain soil health\n• Use green manure crops like dhaincha or sunhemp\n\nWhat specific soil issue are you facing?";
    }
    if (lowerMessage.includes('pest')) {
      return "🐛 For pest control:\n• Use beneficial insects like ladybugs\n• Try neem oil spray (natural pesticide)\n• Practice crop rotation\n• Use companion planting (e.g., marigold with vegetables)\n• Install pheromone traps for monitoring\n• Apply bio-pesticides like Bt (Bacillus thuringiensis)\n\nWhat pests are troubling your crops?";
    }
    if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      return "💧 Watering & Irrigation tips:\n• Most crops need 1-2 inches of water per week\n• Water deeply but less frequently\n• Consider drip irrigation (saves 30-50% water)\n• Water early morning or evening to reduce evaporation\n• Mulching helps retain soil moisture\n• Sprinkler irrigation is good for field crops\n\nWhat crops are you watering?";
    }
    if (/\b(fertilizer|fertiliser|nutrient|nitrogen|phosphorus|potassium|deficiency)\b/.test(lowerMessage)) {
      return "🧪 Fertilizer guidance:\n• Always test soil before applying fertilizers\n• NPK ratios vary by crop and growth stage\n• Organic options: vermicompost, FYM, bone meal\n• Apply urea in split doses for better absorption\n• Micronutrients (Zinc, Boron) are often overlooked\n• Follow recommended doses — excess harms soil\n\nWhat crops need fertilizing?";
    }
    if (lowerMessage.includes('disease')) {
      return "🔬 Disease management:\n• Early detection is the key to control\n• Remove and destroy affected plant parts\n• Improve air circulation between plants\n• Use disease-resistant varieties\n• Apply fungicides preventively in humid weather\n• Seed treatment before sowing prevents many diseases\n\nDescribe the symptoms you're seeing?";
    }
    if (lowerMessage.includes('harvest')) {
      return "🌾 Harvest timing:\n• Check crop maturity indicators (color, moisture content)\n• Consider weather — harvest before heavy rains\n• Harvest at optimal moisture (wheat: 14%, rice: 20-22%)\n• Use proper storage to prevent post-harvest losses\n• Dry grains to safe moisture levels before storage\n• Clean storage structures to prevent pest infestation\n\nWhich crop are you planning to harvest?";
    }
    if (/\b(seed|seeds|sow|sowing|planting)\b/.test(lowerMessage)) {
      return "🌱 Seed & Sowing tips:\n• Use certified seeds for best results\n• Treat seeds with fungicides before sowing\n• Follow recommended spacing for your crop\n• Sow at the right depth (usually 2-3x seed diameter)\n• Check seed germination rate before sowing\n• Kharif sowing: June-July, Rabi sowing: October-November\n\nWhat crop are you planning to sow?";
    }
    if (lowerMessage.includes('organic') || lowerMessage.includes('natural')) {
      return "🌿 Organic Farming tips:\n• Start with composting and vermicomposting\n• Use bio-fertilizers (Rhizobium, Azotobacter)\n• Practice crop rotation and intercropping\n• Use neem-based pesticides\n• Maintain beneficial insect populations\n• Get organic certification for premium prices\n\nWhat aspect of organic farming interests you?";
    }
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('monsoon')) {
      return "🌤️ Weather & Seasonal advice:\n• Kharif season (June-Oct): Rice, maize, cotton, soybean\n• Rabi season (Oct-Mar): Wheat, mustard, gram, peas\n• Zaid season (Mar-Jun): Watermelon, cucumber, moong\n• Prepare drainage before monsoon\n• Protect crops from frost in winter\n\nWhat season are you preparing for?";
    }
    if (lowerMessage.includes('scheme') || lowerMessage.includes('government') || lowerMessage.includes('subsidy')) {
      return "🏛️ Government Schemes for Farmers:\n• PM-KISAN: ₹6,000/year direct income support\n• PM Fasal Bima Yojana: Crop insurance\n• KCC (Kisan Credit Card): Easy farm credit\n• Soil Health Card Scheme: Free soil testing\n• PMKSY: Micro-irrigation subsidies\n• e-NAM: Online agricultural marketing\n\nWhich scheme would you like to know more about?";
    }

    return "🌿 I'm here to help with all your agricultural questions! Ask me about:\n• 🌱 Crop cultivation & sowing\n• 🌍 Soil management\n• 🐛 Pest control\n• 💧 Irrigation & water management\n• 🧪 Fertilizers & nutrients\n• 🔬 Disease management\n• 🌾 Harvesting & storage\n• 🌿 Organic farming\n• 🏛️ Government schemes\n• 🌤️ Weather & seasonal advice\n\nWhat farming challenge can I help you with?";
  }
}

module.exports = new GeminiService();
