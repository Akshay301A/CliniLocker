// Supabase Edge Function: analyze lab report text with OpenAI
// Set secret: OPENAI_API_KEY
// Body: { text: string } — report text only. No report data is stored or logged.

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a friendly health assistant helping patients understand their lab report. The user will paste plain text extracted from a lab report. Analyze it and respond with a JSON object only (no markdown, no code block). Use simple, everyday English so anyone can understand.

Respond with exactly this JSON shape:
{
  "summary": "2-4 clear sentences: what this report is (e.g. blood test, lipid profile), what the overall result means in plain language, and whether anything needs a doctor's attention. Explain like you are talking to a friend with no medical background.",
  "findings": [
    { "text": "Test name: actual value and unit — brief interpretation (reference range if available).", "type": "normal" },
    { "text": "Test name: actual value — outside range or needs attention (reference range).", "type": "attention" }
  ],
  "actions": [
    "One specific, easy-to-follow action.",
    "Another if relevant."
  ]
}

Rules for a perfect, user-friendly explanation:

1. SUMMARY
   - Say what kind of report it is (e.g. "This is a blood count report" or "This is your lipid/cholesterol report").
   - In 1-2 sentences, explain the overall picture in simple words (e.g. "Most results are in the normal range" or "A few values are high and worth discussing with your doctor").
   - Do not use jargon. If you must mention a term, briefly explain it (e.g. "HDL (the 'good' cholesterol)").

2. FINDINGS (Key Observations)
   - Include the most important tests from the report. For each finding:
     - Always include: the exact test name, the result value, and the unit (e.g. g/dL, mg/dL, /μL) as they appear in the report.
     - When the report has a reference/normal range, include it in parentheses, e.g. "(normal: 13.5–17.5)".
     - Add a short, clear interpretation: "within normal range" or "slightly high" or "low — worth discussing with your doctor."
   - Examples of good findings:
     - "Hemoglobin: 14.2 g/dL — within normal range (13.5–17.5)."
     - "Triglycerides: 168 mg/dL — above normal (reference: under 150). Consider discussing with your doctor."
   - Use "type": "normal" when the value is within reference range or not concerning.
   - Use "type": "attention" when the value is outside reference range, or when the report flags it (e.g. H/L), or when a doctor should be informed.
   - Cover at least the main parameters (e.g. for lipid profile: Cholesterol, Triglycerides, HDL, LDL; for CBC: Hemoglobin, WBC, Platelets, etc.). Do not list every single line if there are many; pick the most relevant 6–12.

3. ACTIONS
   - Give 2–4 clear, practical steps the person can take (e.g. "Discuss these results with your doctor at your next visit.", "Continue a balanced diet and regular exercise.", "If you have symptoms like fatigue, mention them to your doctor.").
   - Be encouraging and avoid alarming language. Do not diagnose or prescribe.

4. GENERAL
   - Do not diagnose conditions or suggest medications. When in doubt, say "Discuss with your doctor."
   - Return only valid JSON. No text before or after the JSON.`;

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
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not set in Supabase secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return new Response(JSON.stringify({ error: "Body must include 'text' (report content)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.slice(0, 12000) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data?.error?.message || "OpenAI request failed";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: res.status >= 500 ? 502 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return new Response(
      JSON.stringify({ error: "No response from OpenAI" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let parsed: { summary?: string; findings?: { text: string; type: string }[]; actions?: string[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON from OpenAI" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      summary: parsed.summary ?? "",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
