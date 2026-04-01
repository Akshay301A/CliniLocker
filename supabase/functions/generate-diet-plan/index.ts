// Supabase Edge Function: generate diet plan based on report text/images + prefs
// Set secret: OPENAI_API_KEY
// Body: { text?: string, images?: string[], prefs: { budget, dietType, goal, customGoal? } }

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a careful clinical nutrition assistant. Create a 1-day diet plan using the lab report content and the user preferences. Respond with JSON only.

Return exactly this JSON shape:
{
  "summary": "2-3 simple sentences for the patient.",
  "daily_plan": [
    {
      "meal": "Breakfast",
      "items": [
        { "name": "Food item", "portion": "portion size", "why": "why this helps" }
      ]
    }
  ],
  "foods_to_avoid": ["Item 1", "Item 2"],
  "notes": ["Short safety note", "Hydration tip"]
}

Rules:
- Make realistic, affordable options for the chosen budget.
- Respect diet type (veg / eggetarian / non-veg).
- Use the report values when visible (e.g., HbA1c, cholesterol) to guide choices.
- If report content is unclear, still provide a safe general plan.
- Keep language simple and non-alarming.
- Return valid JSON only.`;

type OpenAIPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function buildUserContent(
  text: string,
  images: string[],
  prefs: { budget: string; dietType: string; goal: string; customGoal?: string }
): string | OpenAIPart[] {
  const goalText = prefs.goal === "custom" && prefs.customGoal ? prefs.customGoal : prefs.goal;
  const prefText = `Preferences:\n- Budget: ${prefs.budget}\n- Diet type: ${prefs.dietType}\n- Goal: ${goalText}`;
  if (images.length === 0) return `${prefText}\n\nReport text:\n${text.slice(0, 12000)}`;
  const parts: OpenAIPart[] = [
    {
      type: "text",
      text: `${prefText}\n\nAnalyze these report page images in order. If extracted text is included, use it to improve accuracy.\n\n${text ? `Extracted text:\n${text.slice(0, 4000)}` : ""}`,
    },
  ];
  for (const url of images) parts.push({ type: "image_url", image_url: { url } });
  return parts;
}

async function callOpenAI(apiKey: string, content: string | OpenAIPart[]) {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
      temperature: 0.2,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set in Supabase secrets." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    text?: string;
    images?: string[];
    prefs?: { budget?: string; dietType?: string; goal?: string; customGoal?: string };
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const images = Array.isArray(body.images)
    ? body.images.filter((img) => typeof img === "string" && img.startsWith("data:image/")).slice(0, 3)
    : [];

  const prefs = {
    budget: body?.prefs?.budget || "medium",
    dietType: body?.prefs?.dietType || "veg",
    goal: body?.prefs?.goal || "general",
    customGoal: body?.prefs?.customGoal || "",
  };

  if (!text && images.length === 0) {
    return new Response(JSON.stringify({ error: "Body must include 'text' or non-empty 'images'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let { res, data } = await callOpenAI(apiKey, buildUserContent(text, images, prefs));
  if (!res.ok && images.length > 0 && text) {
    const fallback = await callOpenAI(apiKey, buildUserContent(text.slice(0, 12000), [], prefs));
    res = fallback.res;
    data = fallback.data;
  }
  if (!res.ok) {
    const errMsg = data?.error?.message || "OpenAI request failed";
    return new Response(JSON.stringify({ error: errMsg, status: res.status }), {
      status: res.status >= 500 ? 502 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return new Response(JSON.stringify({ error: "No response from OpenAI" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let parsed: {
    summary?: string;
    daily_plan?: { meal?: string; items?: { name?: string; portion?: string; why?: string }[] }[];
    foods_to_avoid?: string[];
    notes?: string[];
  };
  try {
    parsed = JSON.parse(content);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON from OpenAI" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      summary: parsed.summary || "",
      daily_plan: Array.isArray(parsed.daily_plan) ? parsed.daily_plan : [],
      foods_to_avoid: Array.isArray(parsed.foods_to_avoid) ? parsed.foods_to_avoid : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      prefs,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
