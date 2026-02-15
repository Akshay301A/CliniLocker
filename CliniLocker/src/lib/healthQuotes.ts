/**
 * Fetches short health & wellness quotes from OpenAI for the dashboard.
 * Uses VITE_OPENAI_API_KEY. For production, consider a backend proxy to keep the key server-side.
 */

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const FALLBACK_QUOTES = [
  "Stay hydrated – drink at least 8 glasses of water daily.",
  "Get your annual health check-up done on time.",
  "A healthy outside starts from the inside. — Robert Urich",
  "Keep your vaccination records up to date.",
  "Small steps every day lead to big health gains.",
];

export async function fetchHealthQuotes(): Promise<string[]> {
  if (!OPENAI_KEY?.startsWith("sk-")) return FALLBACK_QUOTES;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content:
              "Return exactly 1 short, inspiring health or wellness quote. No numbering or bullets. Keep it under 100 characters. Mix motivation and practical tips.",
          },
        ],
        max_tokens: 200,
      }),
    });
    if (!res.ok) return FALLBACK_QUOTES;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return FALLBACK_QUOTES;
    const lines = text
      .split("\n")
      .map((s: string) => s.replace(/^[\d\.\-\*]\s*/, "").trim())
      .filter((s: string) => s.length > 10);
    return lines.length >= 1 ? [lines[0].trim()] : [FALLBACK_QUOTES[0]];
  } catch {
    return FALLBACK_QUOTES;
  }
}
