const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type Verdict = 'Fraud/Scam' | 'Verified/Safe' | 'Misleading' | 'Satire' | 'Unverified';

const MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, isNaN(n) ? 50 : n));

function safeParseJSON(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

function normalizeVerdict(v: unknown): Verdict {
  if (typeof v !== 'string') return 'Unverified';
  const lc = v.toLowerCase();
  if (lc.includes('fraud') || lc.includes('scam')) return 'Fraud/Scam';
  if (lc.includes('verified') || lc.includes('safe') || lc.includes('true') || lc.includes('supported')) return 'Verified/Safe';
  if (lc.includes('mislead') || lc.includes('contradict')) return 'Misleading';
  if (lc.includes('satire') || lc.includes('parody')) return 'Satire';
  return 'Unverified';
}

function buildPrompt(content: string, langName: string): string {
  return `You are TrustAI, an expert misinformation & scam analyst. Analyze the user-provided message or URL and return a strict JSON object.
USER CONTENT:
"""
${content}
"""
Return ONLY valid JSON (no markdown, no code fences) matching this exact schema:
{
  "verdict": "Fraud/Scam" | "Verified/Safe" | "Misleading" | "Satire" | "Unverified",
  "summary": "1-2 sentence human-readable verdict",
  "originalClaim": "verbatim or lightly summarized claim",
  "senderInfo": "any identifiable sender/channel info, or 'Not available'",
  "sources": [ { "title": "...", "url": "https://...", "outlet": "..." } ],
  "tactics": ["Urgency", "Fear-mongering", "Authority impersonation", "..."],
  "detailedExplanation": "3-5 sentence expert explanation of why this verdict was assigned",
  "trustScore": 0-100,
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "sourceReliability": 0-100,
  "contentConsistency": 0-100
}
Rules:
- For known scams/phishing => Fraud/Scam, high risk, trustScore < 25.
- For verifiable established facts => Verified/Safe, trustScore > 75.
- For partially-true but distorted claims => Misleading.
- For humor/parody => Satire.
- If uncertain => Unverified, medium trust.
- Provide 2-4 credible sources with real URLs (fact-checkers, official gov, or major outlets).
- "tactics" must list concrete manipulation tactics observed.
The user has selected ${langName} as their interface language. Regardless of what language the user types their prompt in, you MUST generate your entire response exclusively in ${langName}. Keep the JSON keys exactly as specified, but write every human-readable JSON value in ${langName}.`;
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
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 2048 },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[verify] ${modelName} http ${res.status}:`, errText);
        lastError = new Error(`${modelName}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text as string;
    } catch (e) {
      console.error(`[verify] ${modelName} failed:`, e instanceof Error ? e.message : e);
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
      return new Response(JSON.stringify({ error: 'Server misconfigured: GEMINI_API_KEY missing. Add a Gemini API key as a secret named GEMINI_API_KEY.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const content: string = String(body?.content ?? '').trim();
    const language: string = String(body?.language ?? 'en').trim();
    const languageNames: Record<string, string> = { en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', zh: 'Mandarin Chinese', ja: 'Japanese', ar: 'Arabic', ur: 'Urdu', bn: 'Bengali', pt: 'Portuguese' };
    const langName = languageNames[language] ?? 'English';
    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (content.length > 8000) {
      return new Response(JSON.stringify({ error: 'Content too long (max 8000 chars).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildPrompt(content, langName);
    const text = await callGemini(prompt, apiKey);
    const parsed = safeParseJSON(text);

    const analysis = {
      id: `A-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      verdict: normalizeVerdict(parsed.verdict),
      summary: String(parsed.summary ?? 'Analysis complete.'),
      originalClaim: String(parsed.originalClaim ?? content.slice(0, 500)),
      senderInfo: String(parsed.senderInfo ?? 'Not available'),
      sources: Array.isArray(parsed.sources)
        ? (parsed.sources as Record<string, unknown>[])
            .filter((s) => s && (s.title || s.url))
            .slice(0, 6)
            .map((s) => ({
              title: String(s.title ?? 'Source'),
              url:
                typeof s.url === 'string' && /^https?:\/\//i.test(s.url)
                  ? s.url
                  : 'https://www.google.com/search?q=' + encodeURIComponent(String(s.title ?? '')),
              outlet: String(s.outlet ?? 'Unknown'),
            }))
        : [],
      tactics: Array.isArray(parsed.tactics) ? (parsed.tactics as unknown[]).map(String).slice(0, 8) : [],
      detailedExplanation: String(parsed.detailedExplanation ?? parsed.summary ?? ''),
      trustScore: clamp(Number(parsed.trustScore)),
      riskLevel: ['Low', 'Medium', 'High', 'Critical'].includes(String(parsed.riskLevel))
        ? (parsed.riskLevel as string)
        : 'Medium',
      sourceReliability: clamp(Number(parsed.sourceReliability)),
      contentConsistency: clamp(Number(parsed.contentConsistency)),
      analyzedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed.';
    console.error('[verify] error:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
