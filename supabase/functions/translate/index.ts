// Supabase Edge Function: translate text via Google Cloud Translation API v2
// Set secret: GOOGLE_TRANSLATE_API_KEY
// Body: { text: string | string[], target: string }  (target = en, hi, ta, te, kn, ml)

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

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

  const apiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing GOOGLE_TRANSLATE_API_KEY in Supabase secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { text?: string | string[]; target?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const target = typeof body.target === "string" ? body.target.trim().toLowerCase() : "";
  const validTargets = ["en", "hi", "ta", "te", "kn", "ml"];
  if (!target || !validTargets.includes(target)) {
    return new Response(
      JSON.stringify({ error: "Body must include 'target' (en, hi, ta, te, kn, ml)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const raw = body.text;
  const texts: string[] = Array.isArray(raw)
    ? raw.filter((t): t is string => typeof t === "string").slice(0, 128)
    : typeof raw === "string" && raw.trim()
      ? [raw.trim()]
      : [];

  if (texts.length === 0) {
    return new Response(
      JSON.stringify({ error: "Body must include 'text' (string or array of strings)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const url = `${GOOGLE_TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, target }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data?.error?.message || "Translation request failed";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const translations = data?.data?.translations ?? [];
  const translated = translations.map((t: { translatedText?: string }) => t?.translatedText ?? "");

  return new Response(
    JSON.stringify(Array.isArray(raw) ? { translated } : { translated: translated[0] }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
