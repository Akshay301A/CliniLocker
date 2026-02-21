/**
 * Generate fun, friendly notification messages for medication reminders
 * Similar to Zomato's flirty/meme-style notifications
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

const SYSTEM_PROMPT = `You are a friendly, fun, and engaging health assistant that creates medication reminder messages. 
Your messages should be:
- Friendly and warm (like talking to a friend)
- Fun and engaging (similar to Zomato's flirty/meme-style notifications)
- Encouraging and supportive
- Short (max 120 characters total)
- Include emojis when appropriate (1-2 emojis max)
- Make taking medicine feel less like a chore
- Use casual, friendly language (like "Hey friend!", "Hey there!", "Quick reminder!")
- Be playful but not unprofessional

Examples of good messages:
- "Hey friend! 💊 Time for your [medication] - let's keep you healthy!"
- "Your [medication] is calling! 📞 Don't keep it waiting 😉"
- "Quick reminder: [medication] time! You've got this! 💪"
- "Hey there! 🌟 Your [medication] ([dosage]) is ready for you!"
- "Medicine o'clock! ⏰ Time for [medication] - stay strong! 💊"
- "Hey! Your [medication] ([dosage]) is waiting! Don't forget 😊"
- "Quick check: [medication] time! You're doing great! 💪"
- "Hey friend! 🌟 Time to take [medication] ([dosage]) - stay healthy! 💊"

Generate ONLY the notification message text. Do not include quotes, markdown, or extra formatting. Just the plain message text.`;

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
    const medication_name = body?.medication_name;
    const dosage = body?.dosage;
    const time_of_day = body?.time_of_day;

    if (!medication_name) {
      return new Response(JSON.stringify({ error: "medication_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use request time_of_day if provided, else derive from server hour
    let timeGreeting = time_of_day || "";
    if (!timeGreeting) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) timeGreeting = "morning";
      else if (hour >= 12 && hour < 17) timeGreeting = "afternoon";
      else if (hour >= 17 && hour < 21) timeGreeting = "evening";
      else timeGreeting = "night";
    }

    const userPrompt = `Generate a fun, friendly notification message for:
- Medication: ${medication_name}
- Dosage: ${dosage || "as prescribed"}
- Time: ${timeGreeting}

Make it engaging and fun, like Zomato's style. Keep it short and friendly.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return new Response(JSON.stringify({ error: "Failed to generate message" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = await response.json();
    let message = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Clean up message (remove quotes, markdown, etc.)
    message = message.replace(/^["']|["']$/g, "").replace(/```[\w]*\n?/g, "").trim();
    
    // Fallback to default if message is empty or too long
    if (!message || message.length > 150) {
      message = `💊 Time to take ${medication_name}${dosage ? ` (${dosage})` : ""}!`;
    }

    return new Response(JSON.stringify({ message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
