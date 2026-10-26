import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizQuestion } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODELS = ['gemini-flash-lite-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

function safeParseArray(text: string): unknown[] {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

export async function POST(_req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `Generate exactly 15 multiple-choice questions for a digital-literacy quiz for everyday internet users.
Mix topics: WhatsApp/SMS scams, phishing emails, fake news, deepfakes, social media manipulation, password hygiene, URL safety, misinformation red flags, AI-generated content, online shopping scams.
Each question presents a "message" (suspicious text/email/post) and asks what the biggest warning sign is.
Return ONLY a valid JSON array (no code fences) of 15 objects with this exact schema:
[
  {
    "id": 1,
    "message": "the suspicious content the user must evaluate",
    "choices": ["Option A", "Option B", "Option C"],
    "correctIndex": 0,
    "explanation": "why the correct answer is correct (2-3 sentences)",
    "topic": "Phishing"
  }
]
Rules:
- ids must be 1..15 in order.
- Each question must have exactly 3 or 4 choices.
- correctIndex must be a valid 0-based index.
- Make them varied, realistic, and freshly worded. Avoid repetition.`;

    let text = '';
    let lastError: unknown = null;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.9, maxOutputTokens: 8192 },
        });
        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break;
      } catch (e) {
        console.error(`[quiz] ${modelName} failed:`, e instanceof Error ? e.message : e);
        lastError = e;
      }
    }

    if (!text) throw lastError ?? new Error('All models failed to respond.');

    const raw = safeParseArray(text);

    if (!Array.isArray(raw) || raw.length < 5) {
      return NextResponse.json({ error: 'Invalid quiz payload from model.' }, { status: 502 });
    }

    const questions: QuizQuestion[] = (raw as Record<string, unknown>[])
      .slice(0, 15)
      .map((q, i) => {
        const choices = Array.isArray(q.choices) ? (q.choices as unknown[]).map(String).slice(0, 4) : [];
        let ci = Number(q.correctIndex);
        if (!Number.isInteger(ci) || ci < 0 || ci >= choices.length) ci = 0;
        return {
          id: i + 1,
          message: String(q.message ?? ''),
          choices,
          correctIndex: ci,
          explanation: String(q.explanation ?? ''),
          topic: String(q.topic ?? 'General'),
        };
      })
      .filter((q) => q.choices.length >= 2 && q.message.length > 0);

    while (questions.length < 15) {
      questions.push({
        id: questions.length + 1,
        message: 'You receive an email claiming you won a $5,000 lottery you never entered, asking for your bank details.',
        choices: [
          'It is a classic prize scam — you cannot win a lottery you never entered',
          'It is a real government notification',
          'It is safe because it mentions a specific amount',
        ],
        correctIndex: 0,
        explanation: 'Unexpected prizes you never entered are a textbook advance-fee scam. Never share bank details.',
        topic: 'Scam',
      });
    }

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quiz generation failed.';
    console.error('[quiz] error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
