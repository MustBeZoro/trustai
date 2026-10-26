import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult, Verdict } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODELS = ['gemini-flash-lite-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

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

function buildPrompt(content: string): string {
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
- "tactics" must list concrete manipulation tactics observed.`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfigured: GEMINI_API_KEY missing.' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const content: string = (body?.content ?? '').toString().trim();
    if (!content) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }
    if (content.length > 8000) {
      return NextResponse.json({ error: 'Content too long (max 8000 chars).' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildPrompt(content);

    let text = '';
    let lastError: unknown = null;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 2048 },
        });
        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break;
      } catch (e) {
        console.error(`[verify] ${modelName} failed:`, e instanceof Error ? e.message : e);
        lastError = e;
      }
    }

    if (!text) {
      throw lastError ?? new Error('All models failed to respond.');
    }

    const parsed = safeParseJSON(text);

    const analysis: AnalysisResult = {
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
        ? (parsed.riskLevel as AnalysisResult['riskLevel'])
        : 'Medium',
      sourceReliability: clamp(Number(parsed.sourceReliability)),
      contentConsistency: clamp(Number(parsed.contentConsistency)),
      analyzedAt: new Date().toISOString(),
    };

    const response = NextResponse.json(analysis);
    const memory = {
      verdict: analysis.verdict,
      summary: analysis.summary.slice(0, 1200),
      originalClaim: analysis.originalClaim.slice(0, 2000),
      senderInfo: analysis.senderInfo.slice(0, 500),
      tactics: analysis.tactics.slice(0, 8),
      detailedExplanation: analysis.detailedExplanation.slice(0, 1800),
      trustScore: analysis.trustScore,
      riskLevel: analysis.riskLevel,
      sourceReliability: analysis.sourceReliability,
      contentConsistency: analysis.contentConsistency,
      analyzedAt: analysis.analyzedAt,
    };
    response.cookies.set('trustai_last_analysis', Buffer.from(JSON.stringify(memory)).toString('base64url'), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed.';
    console.error('[verify] error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
