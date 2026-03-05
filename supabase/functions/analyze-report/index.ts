// Supabase Edge Function: analyze lab report text/images with OpenAI
// Set secret: OPENAI_API_KEY
// Body: { text?: string, images?: string[] } - no report data is stored or logged.

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a friendly health assistant helping patients understand their lab report. Input can be plain extracted text, page images, or both. Read all visible content carefully and then return JSON only.

Respond with exactly this JSON shape:
{
  "summary": "2-4 clear sentences in simple language.",
  "findings": [
    { "text": "Test name with value/unit and short interpretation.", "type": "normal" },
    { "text": "Test name with value/unit and reason for attention.", "type": "attention" }
  ],
  "actions": [
    "One practical next step.",
    "Another practical step if useful."
  ]
}

Rules:
- Use simple, non-alarming language.
- Include exact values, units, and reference ranges when visible.
- Mark out-of-range or flagged values as "attention".
- If multiple pages are provided, mention page number explicitly in findings text (example: "Page 2 - LDL: ...").
- Cover each provided page at least once when content is readable.
- Return valid JSON only.`;

type OpenAIPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function buildUserContent(text: string, images: string[]): string | OpenAIPart[] {
  if (images.length === 0) return text.slice(0, 12000);
  const pageHints = images.map((_, i) => `Page ${i + 1} = Image ${i + 1}`).join("\n");
  const parts: OpenAIPart[] = [
    {
      type: "text",
      text:
        "Analyze these lab report page images in order.\n" +
        pageHints +
        "\nIf extracted text is included, use it to improve accuracy.\n\n" +
        (text ? `Extracted text:\n${text.slice(0, 4000)}` : ""),
    },
  ];
  for (const url of images) {
    parts.push({ type: "image_url", image_url: { url } });
  }
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
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

  let body: { text?: string; images?: string[] };
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

  if (!text && images.length === 0) {
    return new Response(JSON.stringify({ error: "Body must include 'text' or non-empty 'images'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let { res, data } = await callOpenAI(apiKey, buildUserContent(text, images));
  if (!res.ok && images.length > 0 && text) {
    const fallback = await callOpenAI(apiKey, text.slice(0, 12000));
    res = fallback.res;
    data = fallback.data;
  }
  if (!res.ok) {
    const errMsg = data?.error?.message || "OpenAI request failed";
    return new Response(
      JSON.stringify({ error: errMsg, status: res.status }),
      {
        status: res.status >= 500 ? 502 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return new Response(JSON.stringify({ error: "No response from OpenAI" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let parsed: { summary?: string; findings?: { text: string; type: string }[]; actions?: string[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON from OpenAI" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = (parsed.summary ?? "").trim();
  const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
  const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
  const hasAnyContent =
    summary.length > 0 ||
    findings.some((f) => typeof f?.text === "string" && f.text.trim().length > 0) ||
    actions.some((a) => typeof a === "string" && a.trim().length > 0);

  if (!hasAnyContent) {
    return new Response(
      JSON.stringify({ error: "Could not extract enough readable report content. Please upload clearer page images." }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ summary, findings, actions }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
