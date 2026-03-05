// Supabase Edge Function: analyze prescription text/images with OpenAI
// Set secret: OPENAI_API_KEY
// Body: { text?: string, images?: string[] } where images are data URLs.

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const TODAY = new Date().toISOString().slice(0, 10);

const SYSTEM_PROMPT = `You are a careful medical assistant that extracts medication information from prescription text or images. Analyze carefully and respond with a JSON object only (no markdown, no code block).

Respond with exactly this JSON shape:
{
  "summary": "Brief 2-3 sentence summary of the prescription (doctor name, date if available, overall purpose)",
  "medications": [
    {
      "medication_name": "Exact medication name as written",
      "dosage": "Dosage amount and unit (e.g., '500mg', '10ml', '1 tablet')",
      "frequency": "How often to take (e.g., '2 times daily', 'once in morning', 'every 8 hours')",
      "duration_days": 7,
      "start_date": "${TODAY}",
      "times": ["08:00", "20:00"],
      "notes": "Any special instructions"
    }
  ],
  "doctor_name": "Doctor name if mentioned",
  "prescription_date": "Date if mentioned (YYYY-MM-DD format)"
}

Rules:
1. Triple-check before final output.
2. Extract ALL medications.
3. Exclude medicines with missing medication_name, dosage, or frequency.
4. If duration missing, set duration_days to null.
5. If times unknown, set times to null.
6. If prescription date missing, start_date should default to today's date (${TODAY}).
7. Return only valid JSON.`;

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
    ? body.images.filter((img) => typeof img === "string" && img.length > 64)
    : [];

  if (!text && images.length === 0) {
    return new Response(JSON.stringify({ error: "Body must include 'text' or 'images'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
  userContent.push({ type: "text", text: text ? text.slice(0, 12000) : "Analyze this prescription image and extract medication reminders." });
  for (const img of images.slice(0, 3)) {
    userContent.push({ type: "image_url", image_url: { url: img } });
  }

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
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data?.error?.message || "OpenAI request failed";
    return new Response(JSON.stringify({ error: errMsg }), {
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
    medications?: Array<{
      medication_name?: string;
      dosage?: string;
      frequency?: string;
      duration_days?: number;
      start_date?: string;
      times?: string[];
      notes?: string;
    }>;
    doctor_name?: string;
    prescription_date?: string;
  };

  try {
    parsed = JSON.parse(content);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON from OpenAI" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const meds = Array.isArray(parsed.medications)
    ? parsed.medications.filter((m) => (m.medication_name || "").trim() && (m.dosage || "").trim() && (m.frequency || "").trim())
    : [];

  return new Response(
    JSON.stringify({
      summary: parsed.summary || "",
      medications: meds,
      doctor_name: parsed.doctor_name || null,
      prescription_date: parsed.prescription_date || null,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
