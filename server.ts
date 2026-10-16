import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with 50MB limit for high-res mobile camera captures & stream frames
app.use(express.json({ limit: '50mb' }));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-Memory Mirror Sessions Store for Real-Time Mobile QR Connect
interface MirrorSession {
  id: string;
  createdAt: number;
  lastActive: number;
  status: 'waiting' | 'connected' | 'streaming' | 'analyzing' | 'completed' | 'error';
  mobileDeviceName?: string;
  previewFrame?: string; // Live viewfinder frame snapshot mirrored to laptop
  fullImage?: string; // Captured high-res photo
  analysis?: any;
  error?: string;
}

const mirrorSessions = new Map<string, MirrorSession>();

// Cleanup stale sessions older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of mirrorSessions.entries()) {
    if (now - session.lastActive > 1800000) {
      mirrorSessions.delete(id);
    }
  }
}, 60000);

// Shared Gemini Analysis Engine
async function analyzeWasteImage(imageBase64: string, mimeType: string) {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  // Handle various base64 prefix formats robustly
  const base64Clean = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64.replace(/^data:[^;]+;base64,/, '');

  const promptText = `You are the Computer Vision engine for the Smart Recycling Assistant on a college campus.
Analyze this waste item image carefully and return a JSON object with:
- objectName: clear specific name of the item (e.g. "Plastic Water Bottle", "Corrugated Cardboard Box", "Glass Soda Bottle", "Banana Peel", "Alkaline AA Battery", "Broken Smartphone", "Aluminium Beverage Can")
- materialType: one of exactly ["plastic", "paper/cardboard", "glass", "metal", "organic material", "textile", "electronic material", "mixed material"]
- categories: an array of applicable categories from ["Recyclable", "Reusable", "Biodegradable", "Hazardous", "General / non-recyclable", "Uncertain / needs verification"] (Can have multiple, e.g. ["Recyclable", "Reusable"])
- confidenceLevel: "High" | "Medium" | "Low"
- confidencePercent: estimated number from 50 to 99 representing qualitative visual certainty
- condition: observed physical state (e.g. "Empty, clean, cap attached", "Flattened with tape", "Cracked glass", "Organic rotting")
- contamination: note any observed food residue, liquids, toxic labels, or tape (or "None visible")
- recommendedAction: clear, practical 1-2 sentence recommendation for campus disposal or reuse
- alternativeAction: fallback action if preferred recycling stream is unavailable
- safetyWarnings: array of safety warnings (e.g. "Contains lithium battery - fire hazard", "Sharp broken edges", "Empty all liquids")
- explanation: brief explanation of why this classification and action was chosen
- targetBinId: recommended campus bin ["B01", "B02", "B03", "B04"] where:
  * B01: Plastics, Metals & Dry Recyclables (Block A)
  * B02: Organics, Food Scraps & Compost (Canteen)
  * B03: Paper, Cardboard & Mixed Dry Goods (Hostel)
  * B04: E-Waste, Batteries & Hazardous Locker (Block B)
- isUncertain: boolean, true if the image is blurry, ambiguous, or no clear waste item is detected.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Clean,
          },
        },
        { text: promptText },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objectName: { type: Type.STRING },
          materialType: { type: Type.STRING },
          categories: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          confidenceLevel: { type: Type.STRING },
          confidencePercent: { type: Type.NUMBER },
          condition: { type: Type.STRING },
          contamination: { type: Type.STRING },
          recommendedAction: { type: Type.STRING },
          alternativeAction: { type: Type.STRING },
          safetyWarnings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          explanation: { type: Type.STRING },
          targetBinId: { type: Type.STRING },
          isUncertain: { type: Type.BOOLEAN },
        },
        required: [
          'objectName',
          'materialType',
          'categories',
          'confidenceLevel',
          'recommendedAction',
          'explanation',
          'targetBinId',
        ],
      },
    },
  });

  const textOutput = response.text || '{}';
  return JSON.parse(textOutput);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Smart Recycling Assistant',
    hasApiKey: Boolean(apiKey),
    activeSessions: mirrorSessions.size,
    timestamp: new Date().toISOString(),
  });
});

// Standard Material Image Analysis API Endpoint
app.post('/api/analyze-material', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        error: 'Missing imageBase64 or mimeType in request payload.',
      });
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(mimeType)) {
      return res.status(400).json({
        error: `Unsupported image type: ${mimeType}. Please upload a JPEG, PNG, or WebP image.`,
      });
    }

    const parsedData = await analyzeWasteImage(imageBase64, mimeType);

    res.json({
      success: true,
      analysis: parsedData,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing material:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze material with Gemini AI',
      code: 'GEMINI_ANALYSIS_FAILED',
    });
  }
});

// ==========================================
// REAL-TIME MOBILE QR CONNECT & SCREEN MIRRORING ENDPOINTS
// ==========================================

// 1. Laptop creates a new QR companion session
app.post('/api/mirror/create', (req, res) => {
  const pin = Math.floor(1000 + Math.random() * 9000);
  const sessionId = `SCAN-${pin}`;

  const { clientOrigin } = req.body || {};
  let baseUrl = clientOrigin || process.env.APP_URL;

  if (!baseUrl) {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    baseUrl = `${protocol}://${host}`;
  }
  // Strip trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  const sessionUrl = `${baseUrl}/?mobileSession=${sessionId}`;

  const newSession: MirrorSession = {
    id: sessionId,
    createdAt: Date.now(),
    lastActive: Date.now(),
    status: 'waiting',
  };

  mirrorSessions.set(sessionId, newSession);

  res.json({
    success: true,
    sessionId,
    sessionUrl,
    createdAt: new Date(newSession.createdAt).toISOString(),
  });
});

function getOrCreateSession(sessionId: string): MirrorSession {
  let session = mirrorSessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActive: Date.now(),
      status: 'waiting',
    };
    mirrorSessions.set(sessionId, session);
  }
  return session;
}

// 2. Poll session state (used by laptop to mirror phone feed and receive results)
app.get('/api/mirror/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);

  session.lastActive = Date.now();

  res.json({
    success: true,
    session: {
      id: session.id,
      status: session.status,
      mobileDeviceName: session.mobileDeviceName,
      previewFrame: session.previewFrame,
      fullImage: session.fullImage,
      analysis: session.analysis,
      error: session.error,
      lastActive: session.lastActive,
    },
  });
});

// 3. Mobile phone reports connection when user opens the QR link
app.post('/api/mirror/:sessionId/connect', (req, res) => {
  const { sessionId } = req.params;
  const { deviceName } = req.body;
  const session = getOrCreateSession(sessionId);

  session.status = 'connected';
  session.mobileDeviceName = deviceName || 'Mobile Camera';
  session.lastActive = Date.now();

  res.json({ success: true, status: session.status });
});

// 4. Mobile phone streams preview frames to mirror live viewfinder on laptop screen
app.post('/api/mirror/:sessionId/frame', (req, res) => {
  const { sessionId } = req.params;
  const { frameBase64 } = req.body;
  const session = getOrCreateSession(sessionId);

  session.previewFrame = frameBase64;
  if (session.status === 'connected' || session.status === 'waiting') {
    session.status = 'streaming';
  }
  session.lastActive = Date.now();

  res.json({ success: true });
});

// 5. Mobile phone triggers scan -> analyzes with Gemini and immediately mirrors result to laptop
app.post('/api/mirror/:sessionId/scan', async (req, res) => {
  const { sessionId } = req.params;
  const { imageBase64, mimeType } = req.body;
  const session = getOrCreateSession(sessionId);

  session.status = 'analyzing';
  session.fullImage = imageBase64;
  session.lastActive = Date.now();

  try {
    const analysis = await analyzeWasteImage(imageBase64, mimeType || 'image/jpeg');

    session.analysis = analysis;
    session.status = 'completed';
    session.lastActive = Date.now();

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Mobile mirror scan error:', error);
    session.status = 'error';
    session.error = error.message || 'Gemini analysis failed';
    session.lastActive = Date.now();

    res.status(500).json({
      error: session.error,
    });
  }
});

// 6. Reset session for another scan
app.post('/api/mirror/:sessionId/reset', (req, res) => {
  const { sessionId } = req.params;
  const session = getOrCreateSession(sessionId);

  session.status = 'streaming';
  session.fullImage = undefined;
  session.analysis = undefined;
  session.error = undefined;
  session.lastActive = Date.now();

  res.json({ success: true, status: session.status });
});

// Conversational AI Assistant Endpoint
app.post('/api/chat-recommendations', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
        code: 'API_KEY_MISSING',
      });
    }

    const { currentMaterial, userPreferences, twinSummary } = context || {};

    const systemInstruction = `You are the Smart Recycling Assistant for a campus community.
Your role is to give practical, concise, safe, and highly actionable circular economy advice.
Target setting: ${userPreferences?.setting || 'college campus/hostel'}.
User goal: ${userPreferences?.goal || 'reduce waste and recycle properly'}.
Preferred action: ${userPreferences?.preferredAction || 'reuse or recycle'}.

Current Campus Digital Twin state:
- Active bins: B01 (Plastics/Metals Block A), B02 (Organics Canteen), B03 (Paper Hostel), B04 (E-Waste Block B)
- Total items logged: ${twinSummary?.totalItems ?? 'N/A'}
- Awaiting collection: ${twinSummary?.awaitingCollection ?? 'N/A'}
- Awaiting sorting: ${twinSummary?.awaitingSorting ?? 'N/A'}

${
  currentMaterial
    ? `The user is currently asking about or has recently scanned:
- Item: ${currentMaterial.objectName} (${currentMaterial.materialType})
- Category: ${currentMaterial.categories?.join(', ')}
- Condition: ${currentMaterial.condition || 'Normal'}
- Status: ${currentMaterial.currentStatus || 'Identified'}
- Assigned Bin: ${currentMaterial.assignedBinId || 'Unassigned'}`
    : 'No specific item is currently selected, but you can answer general recycling, upcycling, or campus disposal questions.'
}

Guidelines:
1. Keep answers concise, friendly, and structured with bullet points.
2. Safety first: If the item is hazardous (batteries, chemical bottles, fluorescent tubes, broken glass, e-waste), caution them strictly against ordinary disposal, never recommend burning or dismantling batteries, and guide them to Locker B04 or specialized handlers.
3. Campus focus: Recommend realistic campus actions (e.g. hostel book exchanges, canteen compost bins, reusable containers, campus thrift/swap desk).
4. If asked about real-time IoT or live sensors, clarify honestly that current sensor values are simulated digital twin models, with physical IoT load-cell deployment planned in next phases.
5. Do not invent non-existent phone numbers or fake off-campus business addresses.`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      reply: response.text || 'I could not generate a response. Please try asking again.',
    });
  } catch (error: any) {
    console.error('Error in chat assistant:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate advice with Gemini AI',
      code: 'GEMINI_CHAT_FAILED',
    });
  }
});

// Start server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Recycling Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
