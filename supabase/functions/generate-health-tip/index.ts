/**
 * Generate friendly health tip notification text.
 * Secret required: OPENAI_API_KEY
 * Body: { language?: string }
 */

// @ts-ignore - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SYSTEM_PROMPT = `You write short, practical daily health tips for mobile notifications.
Rules:
- Health-tip only. No diagnosis, no medicine advice.
- One sentence, 70-140 characters.
- Friendly and clear.
- Plain text only.`;

function fallbackTip(): string {
  return "Today’s tip: stay hydrated, move for 20 minutes, and sleep on time for better long-term health.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const language = typeof body?.language === "string" ? body.language.trim() : "en";

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ message: fallbackTip() }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userPrompt = `Generate one daily health tip notification in language: ${language}.
Keep it generic and safe.`;

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
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ message: fallbackTip() }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = await response.json();
    let message = String(data?.choices?.[0]?.message?.content ?? "").trim();
    message = message.replace(/^["']|["']$/g, "").replace(/```[\w]*\n?/g, "").trim();
    if (!message || message.length < 40 || message.length > 180) {
      message = fallbackTip();
    }
    return new Response(JSON.stringify({ message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch {
    return new Response(JSON.stringify({ message: fallbackTip() }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

