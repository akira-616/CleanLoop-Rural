/**
 * Full-stack Express server with Vite dev middleware
 * Provides backend Gemini API integration via @google/genai SDK
 */

import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    demoDate: '2026-10-04',
  });
});

// JSON extraction schema for note reading
const noteExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    visit_date: {
      type: Type.OBJECT,
      properties: {
        value: { type: Type.STRING, description: 'YYYY-MM-DD or null if unclear' },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
    blood_pressure: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.OBJECT,
          properties: {
            systolic: { type: Type.NUMBER },
            diastolic: { type: Type.NUMBER },
          },
        },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
    blood_sugar: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            type: { type: Type.STRING, description: 'fasting, random, post-meal, or unknown' },
          },
        },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
    weight_kg: {
      type: Type.OBJECT,
      properties: {
        value: { type: Type.NUMBER },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
    medicines: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dose: { type: Type.STRING },
              frequency: { type: Type.STRING },
              change: { type: Type.STRING, description: 'started, increased, continued, stopped, or unknown' },
            },
            required: ['name'],
          },
        },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
    tests_ordered: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              when_text: { type: Type.STRING },
              due_in_days: { type: Type.NUMBER },
            },
            required: ['name'],
          },
        },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
    planned_followup: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.OBJECT,
          properties: {
            what: { type: Type.STRING },
            when_text: { type: Type.STRING },
            due_in_days: { type: Type.NUMBER },
            absolute_date: { type: Type.STRING },
          },
        },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
    referral: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.OBJECT,
          properties: {
            to: { type: Type.STRING },
            reason: { type: Type.STRING },
            when_text: { type: Type.STRING },
          },
        },
        confidence: { type: Type.STRING, description: 'low, medium, or high' },
      },
      required: ['confidence'],
    },
  },
};

/**
 * 5a. extractNote: Multimodal note digitization with confidence scores
 */
app.post('/api/gemini/extract-note', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/png', noteText, visitDateHint } = req.body;

    if (!imageBase64 && !noteText) {
      return res.status(400).json({ error: 'Please provide an image or note text in request body' });
    }

    if (!ai) {
      return res.json({
        success: false,
        error: 'Gemini API is not configured on the server. Falling back to offline manual review.',
        isFallbackAvailable: true,
      });
    }

    let contentsPayload: any;

    if (imageBase64) {
      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const promptText = `You are reading a photo of a rural clinic patient note (may be handwritten or typed, English/Hindi mix). Extract these fields as JSON only: visit_date, blood_pressure, blood_sugar (with type if mentioned: fasting/random/post-meal/unknown), weight_kg, medicines, tests_ordered, planned_followup (what and when), referral. If a value is unclear or missing, use null. Do not guess. Do not infer diagnoses. Do not add information that is not written. Return a confidence (low/medium/high) for each field. Treat Hindi numerals (१, २, ३...) and Hindi phrases (जैसे '२ हफ्ते बाद' = after 2 weeks, 'सुबह खाली पेट' = fasting sugar) accurately.
${visitDateHint ? `Note: possible reference visit date is around ${visitDateHint}.` : ''}
${noteText ? `Accompanying transcript/note text: """${noteText}"""` : ''}`;

      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      };
    } else {
      // Text-based extraction from typed/pasted note
      const textPrompt = `You are reading a rural clinic patient note (typed or transcribed doctor's prescription note, English/Hindi mix). Extract these fields as JSON only: visit_date, blood_pressure, blood_sugar (with type if mentioned: fasting/random/post-meal/unknown), weight_kg, medicines, tests_ordered, planned_followup (what and when), referral. If a value is unclear or missing, use null. Do not guess. Do not infer diagnoses. Do not add information that is not written. Return a confidence (low/medium/high) for each field. Treat Hindi numerals (१, २, ३...) and Hindi phrases (जैसे '२ हफ्ते बाद' = after 2 weeks, 'सुबह खाली पेट' = fasting sugar) accurately.
${visitDateHint ? `Note: reference visit date is around ${visitDateHint}.` : ''}

Prescription Note Content:
"""
${noteText}
"""`;

      contentsPayload = textPrompt;
    }

    let response: any = null;
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: contentsPayload,
          config: {
            responseMimeType: 'application/json',
            responseSchema: noteExtractionSchema,
            temperature: 0.1,
          },
        });
        if (response) break;
      } catch (err: any) {
        console.warn(`[Gemini Extract Note] Model ${modelName} unavailable or rate-limited:`, err?.message?.slice(0, 120) || 'API limit');
        continue; // Try next model in sequence
      }
    }

    if (!response) {
      return res.json({
        success: false,
        error: 'Gemini free-tier quota reached. Switched to smart clinical fallback extractor.',
        isFallbackAvailable: true,
        rateLimited: true,
      });
    }

    const responseText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(responseText);

    res.json({
      success: true,
      data: parsedData,
      source: 'gemini',
    });
  } catch (error: any) {
    console.warn('[Gemini Extract Note notice]:', error?.message?.slice(0, 120) || 'Serving fallback');
    res.json({
      success: false,
      error: 'Gemini rate-limited or quota exhausted. Serving clinical fallback parser.',
      isFallbackAvailable: true,
      rateLimited: true,
    });
  }
});

/**
 * 5b. explainFlag: Rephrases deterministic clinical signals in natural EN/HI
 */
app.post('/api/gemini/explain-flag', async (req: Request, res: Response) => {
  const { flagFacts, language = 'en', templateReason } = req.body;

  try {
    if (!ai) {
      return res.json({
        success: false,
        explanation: templateReason,
        fallbackReason: templateReason,
        source: 'rule',
      });
    }

    const langName = language === 'hi' ? 'Hindi' : 'English';
    const closingPhrase = language === 'hi' ? 'डॉक्टर द्वारा समीक्षा की सलाह दी जाती है' : 'Doctor review recommended';

    const promptText = `Rewrite this clinical decision-support note in plain, simple ${langName} for a traveling doctor, in at most 2 short sentences. Use ONLY the facts provided below. Do not add numbers, causes, diagnoses, or treatment advice. Do not say the patient 'has' any disease. End with '${closingPhrase}'.

Input Facts:
${JSON.stringify(flagFacts, null, 2)}

Original Template:
"${templateReason}"`;

    let response: any = null;
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            temperature: 0.2,
          },
        });
        if (response) break;
      } catch (err: any) {
        console.warn(`[Gemini Explain Flag] Model ${modelName} notice:`, err?.message?.slice(0, 120) || 'API limit');
        continue;
      }
    }

    const outputText = response?.text?.trim() || templateReason;

    res.json({
      success: Boolean(response),
      explanation: outputText,
      language,
      source: response ? 'ai' : 'rule',
    });
  } catch (error: any) {
    console.warn('[Gemini Explain Flag notice]:', error?.message?.slice(0, 120) || 'Serving fallback template');
    res.json({
      success: false,
      explanation: templateReason,
      fallbackReason: templateReason,
      rateLimited: true,
      source: 'rule',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareLoop Rural server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
