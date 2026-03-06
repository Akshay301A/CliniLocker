import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeJwtPayload(token: string): { sub?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as { sub?: string; role?: string; exp?: number };
  } catch {
    return null;
  }
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
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const inviteFromEmail = Deno.env.get("INVITE_FROM_EMAIL");

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !inviteFromEmail) {
    return new Response(JSON.stringify({ error: "Missing required secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    email?: string;
    inviteLink?: string;
    memberName?: string;
    familyMemberId?: string;
    logoUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const inviteLink = typeof body.inviteLink === "string" ? body.inviteLink.trim() : "";
  const memberName = typeof body.memberName === "string" ? body.memberName.trim() : "";
  const familyMemberId = typeof body.familyMemberId === "string" ? body.familyMemberId.trim() : "";
  const logoUrlRaw = typeof body.logoUrl === "string" ? body.logoUrl.trim() : "";
  const logoUrl = isSafeHttpsUrl(logoUrlRaw) ? logoUrlRaw : "";

  if (!email || !isValidEmail(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!inviteLink || !/^https?:\/\//i.test(inviteLink)) {
    return new Response(JSON.stringify({ error: "Invalid invite link" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
  let userId = "";

  if (accessToken) {
    // For JWT-protected edge functions, the token is already verified by gateway.
    // Decode is enough and avoids intermittent getUser() failures in mobile WebView flows.
    const payload = decodeJwtPayload(accessToken);
    const now = Math.floor(Date.now() / 1000);
    if (
      payload?.sub &&
      payload?.role === "authenticated" &&
      (!payload.exp || payload.exp > now)
    ) {
      userId = payload.sub;
    }
  }

  if (!userId) {
    const authUserHeader =
      req.headers.get("x-supabase-auth-user") ??
      req.headers.get("X-Supabase-Auth-User") ??
      "";
    if (authUserHeader) {
      try {
        const parsed = JSON.parse(authUserHeader) as { id?: string };
        if (parsed?.id) userId = parsed.id;
      } catch {
        // ignore header parse fallback
      }
    }
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized", details: "Unable to resolve requester user" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (familyMemberId) {
    const { data: fm } = await adminClient
      .from("family_members")
      .select("id")
      .eq("id", familyMemberId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!fm) {
      return new Response(JSON.stringify({ error: "Not allowed for this family member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const inviterName = profile?.full_name?.trim() || "A family member";

  const safeMemberName = escapeHtml(memberName || "there");
  const safeInviterName = escapeHtml(inviterName);
  const safeInviteLink = inviteLink;
  const safeLogoImg = logoUrl
    ? `<img src="${logoUrl}" alt="CliniLocker" width="140" style="display:block;margin:0 auto 14px auto;" />`
    : `<div style="text-align:center;font-size:22px;font-weight:700;color:#0f172a;margin-bottom:12px;">CliniLocker</div>`;

  const subject = "You are invited to join CliniLocker Family";
  const html = `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
        ${safeLogoImg}
        <h2 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;">Family Invite from ${safeInviterName}</h2>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
          Hi ${safeMemberName},
        </p>
        <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
          You have been invited to join family sharing in <b>CliniLocker</b> to securely access shared health reports and updates.
        </p>
        <div style="margin:20px 0;text-align:center;">
          <a href="${safeInviteLink}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">
            Accept Invite
          </a>
        </div>
        <p style="margin:16px 0 0 0;font-size:13px;color:#475569;line-height:1.6;">
          If the button does not work, copy and open this link:
          <br />
          <a href="${safeInviteLink}" style="color:#0284c7;word-break:break-all;">${safeInviteLink}</a>
        </p>
      </div>
    </div>
  `;

  const text = [
    `Hi ${memberName || "there"},`,
    "",
    `${inviterName} invited you to join family sharing in CliniLocker.`,
    "Open the link below to accept the invite:",
    inviteLink,
  ].join("\n");

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: inviteFromEmail,
      to: [email],
      subject,
      html,
      text,
    }),
  });

  const resendData = await resendRes.json().catch(() => ({}));
  if (!resendRes.ok) {
    return new Response(
      JSON.stringify({
        error: resendData?.message || resendData?.error || "Failed to send invite email",
        details: resendData,
      }),
      { status: resendRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ ok: true, id: resendData?.id ?? null }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
