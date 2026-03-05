/**
 * Generate friendly medication reminder message text.
 * Set secret: OPENAI_API_KEY
 * Body: { medication_name: string, dosage?: string, time_of_day?: string }
 */

// @ts-ignore - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SYSTEM_PROMPT = `You write medication reminder notifications.
Rules:
- Warm, clear, and supportive.
- Professional but friendly.
- 60 to 120 characters.
- Plain text only.
- No medical diagnosis.
- No markdown, no quotes, no hashtags.
- Mention medicine name and dose naturally.`;

function fallbackMessage(medicationName: string, dosage?: string, timeOfDay?: string): string {
  const dose = dosage?.trim() ? ` (${dosage.trim()})` : "";
  if (timeOfDay === "morning") return `Good morning. Please take ${medicationName}${dose} now.`;
  if (timeOfDay === "afternoon") return `Friendly reminder: please take ${medicationName}${dose}.`;
  if (timeOfDay === "evening") return `Good evening. It is time for ${medicationName}${dose}.`;
  if (timeOfDay === "night") return `Before rest, please take ${medicationName}${dose}.`;
  return `Reminder: please take ${medicationName}${dose}.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const medication_name = typeof body?.medication_name === "string" ? body.medication_name.trim() : "";
    const dosage = typeof body?.dosage === "string" ? body.dosage.trim() : "";
    const time_of_day = typeof body?.time_of_day === "string" ? body.time_of_day.trim().toLowerCase() : "";

    if (!medication_name) {
      return new Response(JSON.stringify({ error: "medication_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ message: fallbackMessage(medication_name, dosage, time_of_day) }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userPrompt = `Medication: ${medication_name}
Dosage: ${dosage || "as prescribed"}
Time: ${time_of_day || "now"}

Create one reminder notification text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 80,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ message: fallbackMessage(medication_name, dosage, time_of_day) }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = await response.json();
    let message = String(data?.choices?.[0]?.message?.content ?? "").trim();
    message = message.replace(/^["']|["']$/g, "").replace(/```[\w]*\n?/g, "").trim();
    if (!message || message.length < 20 || message.length > 150) {
      message = fallbackMessage(medication_name, dosage, time_of_day);
    }

    return new Response(JSON.stringify({ message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to generate message" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
