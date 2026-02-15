// Supabase Edge Function: send WhatsApp message via Meta WhatsApp Cloud API
// Set secrets: WA_ACCESS_TOKEN, WA_PHONE_NUMBER_ID
// See supabase/functions/WHATSAPP_SETUP.md for setup.

/** Deno runtime (Supabase Edge Functions run on Deno, not Node) */
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const accessToken = Deno.env.get("WA_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WA_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    return new Response(
      JSON.stringify({
        error: "Missing WhatsApp config. Set WA_ACCESS_TOKEN and WA_PHONE_NUMBER_ID in Supabase secrets.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { to?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const toRaw = typeof body.to === "string" ? body.to.trim() : "";
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!toRaw || !messageBody) {
    return new Response(
      JSON.stringify({ error: "Body must include 'to' (phone number) and 'body' (message text)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // WhatsApp Cloud API expects number without + (e.g. 919876543210)
  const to = toRaw.replace(/\D/g, "");

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: messageBody },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data.error?.message || data.error?.error_user_msg || "WhatsApp API request failed";
    const code = data.error?.code;
    return new Response(
      JSON.stringify({ error: errMsg, code }),
      { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, messageId: data.messages?.[0]?.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
