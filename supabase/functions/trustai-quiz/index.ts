interface QuizQuestion {
  id: number;
  message: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  topic?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function safeParseArray(text: string): unknown[] {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  let lastError: unknown = null;
  for (const modelName of MODELS) {
    try {
      const res = await fetch(`${API_BASE}/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.9, maxOutputTokens: 8192 },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[quiz] ${modelName} http ${res.status}:`, errText);
        lastError = new Error(`${modelName}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text as string;
    } catch (e) {
      console.error(`[quiz] ${modelName} failed:`, e instanceof Error ? e.message : e);
      lastError = e;
    }
  }
  throw lastError ?? new Error('All models failed to respond.');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: GEMINI_API_KEY missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const language: string = String(body?.language ?? 'en').trim();
    const languageNames: Record<string, string> = { en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', zh: 'Mandarin Chinese', ja: 'Japanese', ar: 'Arabic', ur: 'Urdu', bn: 'Bengali', pt: 'Portuguese' };
    const langName = languageNames[language] ?? 'English';
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
- Make them varied, realistic, and freshly worded. Avoid repetition.
The user has selected ${langName} as their interface language. Regardless of what language the user types their prompt in, you MUST generate your entire response exclusively in ${langName}. Keep the JSON keys and correctIndex numeric values unchanged.`;

    const text = await callGemini(prompt, apiKey);
    const raw = safeParseArray(text);

    if (!Array.isArray(raw) || raw.length < 5) {
      return new Response(JSON.stringify({ error: 'Invalid quiz payload from model.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quiz generation failed.';
    console.error('[quiz] error:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
