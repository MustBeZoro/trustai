const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[chat] ${modelName} http ${res.status}:`, errText);
        lastError = new Error(`${modelName}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return (text as string).trim();
    } catch (e) {
      console.error(`[chat] ${modelName} failed:`, e instanceof Error ? e.message : e);
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
    const message: string = String(body?.message ?? '').trim();
    const userName: string = String(body?.userName ?? 'friend').slice(0, 40);
    const langCode: string = String(body?.language ?? 'en').trim();
    const LANG_NAMES: Record<string, string> = {
      en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', zh: 'Mandarin Chinese',
      ja: 'Japanese', ar: 'Arabic', ur: 'Urdu', bn: 'Bengali', pt: 'Portuguese',
    };
    const langName = LANG_NAMES[langCode] ?? 'English';
    const history: Msg[] = Array.isArray(body?.history)
      ? (body.history as unknown[])
          .filter((item): item is Msg => {
            if (!item || typeof item !== 'object') return false;
            const c = item as Record<string, unknown>;
            return (c.role === 'user' || c.role === 'assistant') && typeof c.text === 'string';
          })
          .slice(-30)
          .map((item: Msg) => ({ role: item.role, text: item.text.slice(0, 4000) }))
      : [];

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = `You are TrustAI, a highly capable general-purpose AI assistant.
The user's name is "${userName}". Use their name naturally when helpful.
Answer general questions across mathematics, physics, coding, planning, schedules, writing, research, and everyday topics with the same care and depth you would bring to digital-safety questions.
When the user pastes a URL, phishing link, email, SMS, social post, or suspicious message, analyze the text and link structure directly, identify red flags, explain the risk, and give safe next steps. Do not claim to have opened or verified a link unless you actually have access to that information.
Be accurate, transparent about uncertainty, and adapt the level of detail to the user's request. Do not force the conversation back to digital safety.
Format your responses beautifully using Markdown. Use line breaks, bullet points, bold text, and 1-2 emojis. Never output a giant block of text.
The user has selected ${langName} as their interface language. Regardless of what language the user types their prompt in, you MUST generate your entire response exclusively in ${langName}.`;

    const convo = history.map((m) => `${m.role === 'user' ? 'User' : 'TrustAI'}: ${m.text}`).join('\n');
    const prompt = `${system}
${convo ? `Conversation so far:\n${convo}\n` : ''}User: ${message}
TrustAI:`;

    const reply = await callGemini(prompt, apiKey);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chat failed.';
    console.error('[chat] error:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
