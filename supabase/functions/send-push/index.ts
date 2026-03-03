// Supabase Edge Function: send push notifications via Firebase Cloud Messaging HTTP v1.
// Requires secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY
// - FCM_PROJECT_ID
// - FCM_SERVICE_ACCOUNT_JSON (full service-account JSON as a one-line string)
//
// Request body:
// {
//   "patient_id"?: "uuid",
//   "patient_phone"?: "+919876543210",
//   "title": "string",
//   "body": "string",
//   "data"?: { "k": "v" }
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OAUTH_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const DEFAULT_TOKEN_URL = "https://oauth2.googleapis.com/token";

function normalizePhone(raw: string): string {
  return raw.replace(/\s/g, "").trim();
}

function toBase64UrlString(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function createGoogleAccessToken(params: {
  clientEmail: string;
  privateKeyPem: string;
  tokenUri?: string;
}): Promise<string> {
  const tokenUrl = params.tokenUri || DEFAULT_TOKEN_URL;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: params.clientEmail,
    scope: OAUTH_SCOPE,
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = toBase64UrlString(JSON.stringify(header));
  const encodedPayload = toBase64UrlString(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(params.privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${toBase64UrlString(new Uint8Array(signature))}`;

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData?.access_token) {
    throw new Error(tokenData?.error_description || tokenData?.error || "Failed to get Google access token");
  }
  return tokenData.access_token as string;
}

type FcmV1ErrorDetail = {
  "@type"?: string;
  errorCode?: string;
};

function getFcmV1ErrorCode(errorBody: unknown): string | null {
  const details = (errorBody as { error?: { details?: FcmV1ErrorDetail[] } })?.error?.details;
  if (!Array.isArray(details)) return null;
  const fcmDetail = details.find((d) => d?.["@type"]?.includes("google.firebase.fcm.v1.FcmError"));
  return fcmDetail?.errorCode ?? null;
}

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const fcmProjectId = Deno.env.get("FCM_PROJECT_ID");
  const fcmServiceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !fcmProjectId || !fcmServiceAccountJson) {
    return new Response(JSON.stringify({ error: "Missing required secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    patient_id?: string;
    patient_phone?: string;
    title?: string;
    body?: string;
    data?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  const patientIdInput = typeof body.patient_id === "string" ? body.patient_id.trim() : "";
  const patientPhoneInput = typeof body.patient_phone === "string" ? normalizePhone(body.patient_phone) : "";
  const customData = body.data && typeof body.data === "object" ? body.data : {};

  if (!title || !message) {
    return new Response(JSON.stringify({ error: "title and body are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!patientIdInput && !patientPhoneInput) {
    return new Response(JSON.stringify({ error: "patient_id or patient_phone is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Caller auth (must be signed-in lab user).
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: authUserData, error: authError } = await authClient.auth.getUser();
  if (authError || !authUserData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerId = authUserData.user.id;
  const { data: callerLabRow, error: callerLabErr } = await authClient
    .from("lab_users")
    .select("id")
    .eq("user_id", callerId)
    .limit(1);

  if (callerLabErr || !callerLabRow || callerLabRow.length === 0) {
    return new Response(JSON.stringify({ error: "Only lab users can send report-ready push notifications" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  let patientId = patientIdInput || "";

  if (!patientId && patientPhoneInput) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("phone", patientPhoneInput)
      .maybeSingle();
    patientId = profile?.id ?? "";
  }

  if (!patientId) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: "patient_not_found" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: tokensRows, error: tokenErr } = await adminClient
    .from("push_tokens")
    .select("token")
    .eq("user_id", patientId);

  if (tokenErr) {
    return new Response(JSON.stringify({ error: tokenErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tokens = (tokensRows ?? [])
    .map((r) => r.token)
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no_registered_devices" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let accessToken = "";
  try {
    const sa = JSON.parse(fcmServiceAccountJson) as {
      client_email?: string;
      private_key?: string;
      token_uri?: string;
    };
    if (!sa.client_email || !sa.private_key) {
      throw new Error("FCM_SERVICE_ACCOUNT_JSON missing client_email/private_key");
    }
    accessToken = await createGoogleAccessToken({
      clientEmail: sa.client_email,
      privateKeyPem: sa.private_key,
      tokenUri: sa.token_uri,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to create FCM access token", details: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(fcmProjectId)}/messages:send`;

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const fcmRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body: message },
          data: customData,
          android: { priority: "high" },
        },
      }),
    });
    const fcmData = await fcmRes.json().catch(() => ({}));
    if (fcmRes.ok) {
      sent += 1;
      continue;
    }
    failed += 1;
    const fcmErrorCode = getFcmV1ErrorCode(fcmData);
    if (fcmErrorCode === "UNREGISTERED" || fcmErrorCode === "INVALID_ARGUMENT") {
      invalidTokens.push(token);
    }
  }

  if (invalidTokens.length > 0) {
    await adminClient.from("push_tokens").delete().eq("user_id", patientId).in("token", invalidTokens);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sent,
      failed,
      invalid_tokens_removed: invalidTokens.length,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
