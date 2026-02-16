/**
 * Health & wellness quotes for the dashboard.
 * OpenAI must never be called from the frontend (the API key would be exposed in the bundle).
 * Use these fallback quotes. For AI-generated quotes, add a backend/Edge Function that calls
 * OpenAI and have the frontend call that endpoint instead.
 */

const FALLBACK_QUOTES = [
  "Stay hydrated – drink at least 8 glasses of water daily.",
  "Get your annual health check-up done on time.",
  "A healthy outside starts from the inside. — Robert Urich",
  "Keep your vaccination records up to date.",
  "Small steps every day lead to big health gains.",
  "Rest well – quality sleep supports your immune system.",
  "Move a little every day; your body will thank you.",
  "When in doubt, talk to your doctor.",
];

export async function fetchHealthQuotes(): Promise<string[]> {
  // Return fallback quotes. Do not use OpenAI or any API key in frontend code.
  return Promise.resolve(FALLBACK_QUOTES);
}
