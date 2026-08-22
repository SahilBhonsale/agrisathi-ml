const express = require('express');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const { authenticate } = require('../middleware/auth');
const localMlService = require('../services/localMlService');
const { formatLocalPrediction } = require('../services/plantDiseaseGuidance');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(file.mimetype.startsWith('image/') ? null : new Error('Only image files are supported'), file.mimetype.startsWith('image/'));
  }
});

const hasGemini = () => Boolean(
  process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('your-')
);

const analyzeWithGemini = async (file) => {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Analyze this plant image as an agricultural plant-health assistant. Return ONLY valid JSON with this exact shape:
{"plantName":"common plant name or Unknown","scientificName":"scientific name or Unknown","healthStatus":"Healthy|Needs attention|Diseased|Uncertain","confidence":0,"disease":"disease name or None detected","symptoms":["visible symptom"],"care":{"watering":"short advice","sunlight":"short advice","soil":"short advice"},"treatment":["safe actionable step"],"prevention":["prevention step"],"disclaimer":"This is an AI visual assessment; consult a local agricultural expert before chemical treatment."}
Confidence must be an integer from 0 to 100. Be conservative: if the image is not clearly a plant or symptoms are unclear, use healthStatus Uncertain and a low confidence. Never invent a precise chemical dosage.`;

  const response = await genAI.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } }
      ]
    }],
    config: { responseMimeType: 'application/json' }
  });
  const raw = response.text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return { ...JSON.parse(raw), provider: 'Gemini Vision fallback' };
};

router.get('/status', async (_req, res) => {
  const local = await localMlService.health();
  const gemini = hasGemini();
  res.json({
    success: true,
    data: {
      available: local.available || gemini,
      provider: local.available ? 'Local MobileNetV2' : gemini ? 'Gemini Vision fallback' : null,
      localModel: {
        available: local.available,
        trained: localMlService.modelArtifactExists(),
        testAccuracy: local.testAccuracy || null,
        classes: local.classes || 14
      },
      geminiFallback: gemini,
      supportedPlants: local.available ? ['Apple', 'Tomato'] : ['Apple', 'Tomato', 'Other crops via Gemini']
    }
  });
});

router.post('/analyze', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a clear plant image' });
    }

    const local = await localMlService.health();
    let localError = null;

    if (local.available) {
      try {
        const prediction = await localMlService.predict(req.file.buffer, req.file.mimetype);
        if (prediction.confidence >= 45 || !hasGemini()) {
          return res.json({ success: true, data: formatLocalPrediction(prediction) });
        }
      } catch (error) {
        localError = error;
        console.error('Local scanner error:', error.message);
      }
    }

    if (!hasGemini()) {
      return res.status(503).json({
        success: false,
        code: 'SCANNER_NOT_CONFIGURED',
        message: localError
          ? 'The local plant model could not complete the analysis. Restart the backend and try again.'
          : 'The local plant model is still starting or has not been trained, and Gemini fallback is not configured.'
      });
    }

    const analysis = await analyzeWithGemini(req.file);
    return res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Scanner analysis error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'The image could not be analyzed. Try a sharp, well-lit photo of one leaf.'
    });
  }
});

module.exports = router;
