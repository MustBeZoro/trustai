declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const trustedSources = [
  {
    title: "How to verify a viral claim in 5 minutes",
    url: "https://www.snopes.com/fact-check/",
    outlet: "Snopes",
  },
  {
    title: "Fact-checking guidance and resources",
    url: "https://www.poynter.org/ifcn/",
    outlet: "Poynter",
  },
  {
    title: "Independent fact-checks and explainers",
    url: "https://fullfact.org/",
    outlet: "Full Fact",
  },
];

const responseSchema = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      enum: ["Supported", "Contradicted", "Unverified"],
    },
    summary: { type: "string" },
    warningSigns: {
      type: "array",
      items: { type: "string" },
    },
    nextSteps: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["verdict", "summary", "warningSigns", "nextSteps"],
};

const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash"];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAnalysisResult(value: unknown): value is {
  verdict: "Supported" | "Contradicted" | "Unverified";
  summary: string;
  warningSigns: string[];
  nextSteps: string[];
} {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    ["Supported", "Contradicted", "Unverified"].includes(String(result.verdict)) &&
    typeof result.summary === "string" &&
    Array.isArray(result.warningSigns) &&
    result.warningSigns.every((item) => typeof item === "string") &&
    Array.isArray(result.nextSteps) &&
    result.nextSteps.every((item) => typeof item === "string")
  );
}

async function callGemini(apiKey: string, prompt: string): Promise<{ ok: boolean; data?: unknown }> {
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema,
    },
  };

  for (const model of models) {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini ${model} failed`, response.status, errorBody);
        if (response.status === 503 || response.status === 429 || response.status === 404) {
          continue;
        }
        return { ok: false };
      }

      const body = await response.json();
      const generatedText = body?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof generatedText !== "string") {
        console.error(`Gemini ${model} returned empty result`);
        continue;
      }

      const parsed = JSON.parse(generatedText);
      if (isAnalysisResult(parsed)) {
        return { ok: true, data: { ...parsed, sources: trustedSources } };
      }

      console.error(`Gemini ${model} returned invalid result`);
    } catch (err) {
      console.error(`Gemini ${model} threw`, err);
    }
  }

  return { ok: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "The analysis service is not configured." }, 503);
    }

    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 8000) {
      return jsonResponse({ error: "Please provide a message under 8,000 characters." }, 400);
    }

    const prompt = `You are a careful misinformation-literacy assistant. Analyze the submitted message for credibility signals. Do not invent sources, claim that you browsed the web, or present your assessment as proof of factual truth. Use Supported only when the wording itself clearly aligns with a well-established fact; use Contradicted only for a clearly false claim; otherwise use Unverified. Keep the summary under 55 words. Return 2 to 5 concrete warning signs and 3 to 4 practical next steps.\n\nMessage:\n${text}`;

    const result = await callGemini(apiKey, prompt);

    if (!result.ok || !result.data) {
      return jsonResponse({ error: "The analysis service could not respond." }, 502);
    }

    return jsonResponse(result.data);
  } catch (error) {
    console.error("Claim analysis failed", error);
    return jsonResponse({ error: "We could not analyze that message. Please try again." }, 500);
  }
});
