// Supabase Edge Function: analyze prescription text with OpenAI
// Set secret: OPENAI_API_KEY
// Body: { text: string } — prescription text only.

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a helpful medical assistant that extracts medication information from prescription text. The user will paste plain text extracted from a prescription document. Analyze it and respond with a JSON object only (no markdown, no code block).

Respond with exactly this JSON shape:
{
  "summary": "Brief 2-3 sentence summary of the prescription (doctor name, date if available, overall purpose)",
  "medications": [
    {
      "medication_name": "Exact medication name as written",
      "dosage": "Dosage amount and unit (e.g., '500mg', '10ml', '1 tablet')",
      "frequency": "How often to take (e.g., '2 times daily', 'once in morning', 'every 8 hours', '3 times a day after meals')",
      "duration_days": 7,
      "start_date": "2025-02-09",
      "times": ["08:00", "20:00"],
      "notes": "Any special instructions (e.g., 'with food', 'before meals', 'avoid alcohol')"
    }
  ],
  "doctor_name": "Doctor name if mentioned",
  "prescription_date": "Date if mentioned (YYYY-MM-DD format)"
}

Rules:
1. Extract ALL medications mentioned in the prescription
2. For each medication:
   - medication_name: Use the exact name as written (e.g., "Paracetamol", "Amoxicillin 500mg")
   - dosage: Extract the amount (e.g., "500mg", "1 tablet", "10ml")
   - frequency: Convert to clear frequency (e.g., "BD" = "2 times daily", "TDS" = "3 times daily", "OD" = "once daily")
   - duration_days: Calculate from duration mentioned (e.g., "7 days" = 7, "2 weeks" = 14, "1 month" = 30)
   - start_date: Use prescription date if available, otherwise use today's date (2025-02-09)
   - times: Suggest times based on frequency:
     * "once daily" or "OD" → ["08:00"]
     * "2 times daily" or "BD" → ["08:00", "20:00"]
     * "3 times daily" or "TDS" → ["08:00", "14:00", "20:00"]
     * "4 times daily" or "QID" → ["08:00", "12:00", "18:00", "22:00"]
     * "every 8 hours" → ["08:00", "16:00", "00:00"]
   - notes: Extract special instructions (e.g., "with food", "before meals", "avoid alcohol", "take with plenty of water")
3. If duration is not mentioned, set duration_days to null
4. If times cannot be determined, set times to null
5. Return only valid JSON. No text before or after.`;

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
    return new Response(JSON.stringify({ error: "Body must include 'text' (prescription content)" }), {
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
    return new Response(
      JSON.stringify({ error: "Invalid JSON from OpenAI" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      summary: parsed.summary || "",
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      doctor_name: parsed.doctor_name || null,
      prescription_date: parsed.prescription_date || null,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
