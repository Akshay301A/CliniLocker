// @ts-ignore Supabase Edge Functions support npm: imports at runtime.
import { createClient } from "npm:@supabase/supabase-js@2";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAMPAIGN_SLUG = "founding500";
const DEFAULT_COUNTRY = "India";

type JsonRecord = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return value.startsWith("+") ? value : `+${digits}`;
}

function digitsPhone(value: string): string {
  return normalizePhone(value).replace(/\D/g, "");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeAddressHash(body: {
  shipping_name: string;
  shipping_phone: string;
  shipping_line1: string;
  shipping_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country?: string;
}) {
  const canonical = [
    body.shipping_name,
    digitsPhone(body.shipping_phone),
    body.shipping_line1,
    body.shipping_line2 ?? "",
    body.shipping_city,
    body.shipping_state,
    body.shipping_pincode,
    body.shipping_country ?? DEFAULT_COUNTRY,
  ]
    .join("|")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return sha256Hex(canonical);
}

function memberCode(index: number): string {
  return `CL-F500-${String(index).padStart(4, "0")}`;
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validationMessages() {
  return [
    "Securing Medical Identity",
    "Verifying Emergency Profile",
    "Checking Founding500 Availability",
    "Activating Emergency QR",
    "Finalizing Founding Access",
  ];
}

async function verifyMsg91AccessToken(accessToken: string) {
  const authKey = Deno.env.get("MSG91_AUTH_KEY");
  if (!authKey) {
    throw new Error("MSG91 auth key is not configured in Supabase secrets.");
  }

  const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      authkey: authKey,
      "access-token": accessToken,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String((data as { message?: string }).message ?? "MSG91 access token verification failed."));
  }

  return data as JsonRecord;
}

function extractMsg91VerifiedIdentifier(payload: JsonRecord): string | null {
  const nested = (payload.data && typeof payload.data === "object" ? payload.data : {}) as JsonRecord;
  const candidates = [
    payload.identifier,
    payload.mobile,
    payload.phone,
    payload.email,
    nested.identifier,
    nested.mobile,
    nested.phone,
    nested.email,
  ];

  const match = candidates.find((value) => typeof value === "string" && String(value).trim());
  return typeof match === "string" ? match.trim() : null;
}

async function getAuthedContext(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing required Supabase secrets");
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return { adminClient: createClient(supabaseUrl, serviceRoleKey), user: null as null | { id: string } };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return { adminClient, user: null as null | { id: string } };
  }

  return { adminClient, user: { id: authData.user.id } };
}

async function getCampaign(adminClient: ReturnType<typeof createClient>) {
  const { data, error } = await adminClient
    .from("emergency_campaigns")
    .select("*")
    .eq("slug", CAMPAIGN_SLUG)
    .maybeSingle();
  if (error || !data) throw new Error("Campaign configuration missing");
  return data as JsonRecord;
}

async function getActivation(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data } = await adminClient
    .from("emergency_identity_activations")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data as JsonRecord;

  const { data: created, error } = await adminClient
    .from("emergency_identity_activations")
    .insert({ user_id: userId, campaign_slug: CAMPAIGN_SLUG })
    .select("*")
    .single();
  if (error || !created) throw new Error("Unable to initialize activation");
  return created as JsonRecord;
}

async function getProgressState(adminClient: ReturnType<typeof createClient>, userId: string) {
  const campaign = await getCampaign(adminClient);
  const activation = await getActivation(adminClient, userId);
  const { data: profile } = await adminClient.from("profiles").select("*").eq("id", userId).maybeSingle();
  const { data: directReports } = await adminClient
    .from("reports")
    .select("id")
    .eq("patient_id", userId);
  const matchedReportIds = new Set(
    ((directReports ?? []) as Array<{ id: string }>).map((row) => String(row.id)),
  );

  const phone = String(profile?.phone ?? "").trim();
  const last10 = digitsPhone(phone).slice(-10);
  if (last10.length === 10) {
    const { data: phoneReports } = await adminClient
      .from("reports")
      .select("id, patient_phone")
      .ilike("patient_phone", `%${last10}%`);

    for (const row of phoneReports ?? []) {
      const candidate = String((row as { patient_phone?: string | null }).patient_phone ?? "");
      if (digitsPhone(candidate).slice(-10) === last10) {
        matchedReportIds.add(String((row as { id: string }).id));
      }
    }
  }
  const reportCount = matchedReportIds.size;

  const latestOrderQuery = await adminClient
    .from("founding500_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestOrder = latestOrderQuery.data?.[0] ?? null;

  const { count: claimedCount } = await adminClient
    .from("founding500_orders")
    .select("id", { count: "exact", head: true })
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .in("status", ["paid", "fulfilled"]);

  const maxClaims = Number(campaign.max_free_claims ?? 500);
  const kitsClaimed = Number(claimedCount ?? 0);
  const kitsRemaining = Math.max(0, maxClaims - kitsClaimed);

  const emergencyProfileComplete = Boolean(
    profile?.blood_group &&
      profile?.emergency_contact_name &&
      profile?.emergency_contact_phone,
  );

  const qrGenerated = Boolean(activation.qr_generated_at);
  const qrSaved = Boolean(activation.qr_saved_at);
  const phoneVerified = Boolean(profile?.phone_verified || activation.phone_verified_at);
  const medicalRecordsComplete = Number(reportCount ?? 0) >= 2;

  const steps = [
    {
      key: "phone",
      title: "Verify phone number",
      description: "Secure your recovery contact channel for emergency access.",
      completed: phoneVerified,
    },
    {
      key: "records",
      title: "Upload 2 medical records",
      description: "Secure your medical history for emergency identity activation.",
      completed: medicalRecordsComplete,
      meta: `${Math.min(Number(reportCount ?? 0), 2)}/2`,
    },
    {
      key: "profile",
      title: "Complete emergency profile",
      description: "Add blood group and emergency contact for emergency use.",
      completed: emergencyProfileComplete,
    },
    {
      key: "qr",
      title: "Generate Emergency QR",
      description: "Activate the emergency QR linked to your medical identity.",
      completed: qrGenerated,
    },
    {
      key: "save",
      title: "Save Emergency QR",
      description: "Add the emergency QR to your device for rapid access.",
      completed: qrSaved,
    },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);
  const campaignClosed = kitsClaimed >= maxClaims;

  const now = new Date().toISOString();
  const activationPatch: Record<string, unknown> = {};
  if (phoneVerified && !activation.phone_verified_at) activationPatch.phone_verified_at = now;
  if (medicalRecordsComplete) activationPatch.medical_records_count = Number(reportCount ?? 0);
  if (emergencyProfileComplete && !activation.emergency_profile_completed_at) activationPatch.emergency_profile_completed_at = now;
  if (qrGenerated && !activation.qr_generated_at) activationPatch.qr_generated_at = now;
  if (qrSaved && !activation.qr_saved_at) activationPatch.qr_saved_at = now;
  if (Object.keys(activationPatch).length) {
    await adminClient.from("emergency_identity_activations").update(activationPatch).eq("user_id", userId);
  }

  const pricingMode =
    activation.eligibility_status === "approved" && !campaignClosed ? "founding500" : "launch_offer";
  const originalPrice = Number(campaign.original_price ?? 499);
  const launchPrice = Number(campaign.launch_price ?? 199);
  const shippingPrice = campaign.shipping_enabled ? Number(campaign.shipping_price ?? 0) : 0;
  const discountedPrice = pricingMode === "founding500" ? 0 : launchPrice;
  const totalPrice = discountedPrice + shippingPrice;

  return {
    campaign,
    activation,
    profile: profile ?? null,
    latestOrder,
    steps,
    completedSteps,
    progressPercent,
    medicalRecordsCount: Number(reportCount ?? 0),
    counts: {
      kitsRemaining,
      kitsClaimed,
      foundingSlotsLeft: kitsRemaining,
    },
    campaignClosed,
    pricing: {
      mode: pricingMode,
      originalPrice,
      discountedPrice,
      shippingPrice,
      totalPrice,
    },
  };
}

async function requireAdmin(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error("Forbidden");
}

async function sendOtpMessage(phone: string, body: string) {
  const accessToken = Deno.env.get("WA_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WA_PHONE_NUMBER_ID");
  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: "OTP delivery is not configured in Supabase secrets." };
  }

  const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: digitsPhone(phone),
      type: "text",
      text: { body },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: data?.error?.message ?? "OTP delivery failed." };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body: JsonRecord;
  try {
    body = (await req.json()) as JsonRecord;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action ?? "");

  try {
    const { adminClient, user } = await getAuthedContext(req);

    if (action === "state") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const state = await getProgressState(adminClient, user.id);
      return jsonResponse({
        ok: true,
        ...state,
        validationMessages: validationMessages(),
      });
    }

    if (action === "send_otp") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const phoneInput = String(body.phone ?? "").trim();
      const phone = normalizePhone(phoneInput);
      if (!/^\+\d{12,14}$/.test(phone)) {
        return jsonResponse({ error: "Enter a valid phone number." }, 400);
      }
      const code = generateOtpCode();
      const codeHash = await sha256Hex(`${user.id}:${phone}:${code}`);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await adminClient
        .from("profiles")
        .update({ phone })
        .eq("id", user.id);

      await adminClient
        .from("emergency_identity_otps")
        .insert({
          user_id: user.id,
          phone,
          code_hash: codeHash,
          expires_at: expiresAt,
        });

      const delivery = await sendOtpMessage(
        phone,
        `CliniLocker Emergency Identity OTP: ${code}. This code secures your medical identity activation and expires in 10 minutes.`,
      );

      if (!delivery.ok) {
        return jsonResponse({
          ok: false,
          deliveryConfigured: false,
          error: delivery.error,
        }, 500);
      }

      return jsonResponse({ ok: true, expiresAt });
    }

    if (action === "verify_otp") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const phone = normalizePhone(String(body.phone ?? "").trim());
      const otp = String(body.otp ?? "").trim();
      if (!otp) return jsonResponse({ error: "OTP is required." }, 400);

      const { data: otpRow } = await adminClient
        .from("emergency_identity_otps")
        .select("*")
        .eq("user_id", user.id)
        .eq("phone", phone)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRow) return jsonResponse({ error: "OTP session not found." }, 404);
      if (new Date(String(otpRow.expires_at)).getTime() < Date.now()) {
        return jsonResponse({ error: "OTP expired. Request a new code." }, 400);
      }

      const expected = await sha256Hex(`${user.id}:${phone}:${otp}`);
      if (expected !== otpRow.code_hash) {
        await adminClient
          .from("emergency_identity_otps")
          .update({ attempts: Number(otpRow.attempts ?? 0) + 1 })
          .eq("id", otpRow.id);
        return jsonResponse({ error: "Incorrect OTP." }, 400);
      }

      const verifiedAt = new Date().toISOString();
      await adminClient
        .from("emergency_identity_otps")
        .update({ consumed_at: verifiedAt })
        .eq("id", otpRow.id);

      await adminClient
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("id", user.id);

      await adminClient
        .from("emergency_identity_activations")
        .upsert({
          user_id: user.id,
          campaign_slug: CAMPAIGN_SLUG,
          phone,
          phone_verified_at: verifiedAt,
        });

      return jsonResponse({ ok: true, verifiedAt });
    }

    if (action === "mark_phone_verified") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const phone = normalizePhone(String(body.phone ?? "").trim());
      if (!/^\+\d{12,14}$/.test(phone)) {
        return jsonResponse({ error: "Enter a valid phone number." }, 400);
      }

      const verifiedAt = new Date().toISOString();
      await adminClient
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("id", user.id);

      await adminClient
        .from("emergency_identity_activations")
        .upsert({
          user_id: user.id,
          campaign_slug: CAMPAIGN_SLUG,
          phone,
          phone_verified_at: verifiedAt,
        });

      return jsonResponse({ ok: true, verifiedAt });
    }

    if (action === "verify_msg91_phone") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const phone = normalizePhone(String(body.phone ?? "").trim());
      const accessToken = String(body.accessToken ?? "").trim();
      if (!/^\+\d{12,14}$/.test(phone)) {
        return jsonResponse({ error: "Enter a valid phone number." }, 400);
      }
      if (!accessToken) {
        return jsonResponse({ error: "OTP verification token is missing." }, 400);
      }

      const verification = await verifyMsg91AccessToken(accessToken);
      const verifiedIdentifier = extractMsg91VerifiedIdentifier(verification);
      if (verifiedIdentifier) {
        const expectedDigits = digitsPhone(phone);
        const actualDigits = digitsPhone(verifiedIdentifier);
        if (actualDigits && expectedDigits !== actualDigits) {
          return jsonResponse({ error: "Verified phone number does not match the requested number." }, 400);
        }
      }

      const verifiedAt = new Date().toISOString();
      await adminClient
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("id", user.id);

      await adminClient
        .from("emergency_identity_activations")
        .upsert({
          user_id: user.id,
          campaign_slug: CAMPAIGN_SLUG,
          phone,
          phone_verified_at: verifiedAt,
        });

      return jsonResponse({ ok: true, verifiedAt });
    }

    if (action === "mark_qr_generated" || action === "mark_qr_saved") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const now = new Date().toISOString();
      const payload =
        action === "mark_qr_generated"
          ? { user_id: user.id, campaign_slug: CAMPAIGN_SLUG, qr_generated_at: now }
          : { user_id: user.id, campaign_slug: CAMPAIGN_SLUG, qr_saved_at: now, qr_generated_at: now };
      const { error } = await adminClient
        .from("emergency_identity_activations")
        .upsert(payload);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ ok: true, at: now });
    }

    if (action === "start_validation") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const state = await getProgressState(adminClient, user.id);
      const allStepsComplete = state.steps.every((step) => step.completed);
      if (!allStepsComplete) {
        return jsonResponse({ error: "Complete all Emergency Identity steps first." }, 400);
      }
      const now = new Date().toISOString();
      const { error } = await adminClient
        .from("emergency_identity_activations")
        .update({
          medical_records_count: state.medicalRecordsCount,
          emergency_profile_completed_at:
            state.profile?.blood_group && state.profile?.emergency_contact_name && state.profile?.emergency_contact_phone
              ? now
              : state.activation.emergency_profile_completed_at,
          validation_started_at: now,
          eligibility_status: "under_validation",
        })
        .eq("user_id", user.id);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ ok: true, startedAt: now });
    }

    if (action === "complete_validation") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const state = await getProgressState(adminClient, user.id);
      const allStepsComplete = state.steps.every((step) => step.completed);
      if (!allStepsComplete) {
        return jsonResponse({ error: "Complete all Emergency Identity steps first." }, 400);
      }

      const now = new Date().toISOString();
      let eligibilityStatus = state.campaignClosed ? "launch_offer" : "approved";
      let foundingMemberId = String(state.activation.founding_member_id ?? "");
      if (eligibilityStatus === "approved" && !foundingMemberId) {
        const { count } = await adminClient
          .from("emergency_identity_activations")
          .select("user_id", { count: "exact", head: true })
          .not("founding_member_id", "is", null);
        foundingMemberId = memberCode(Number(count ?? 0) + 1);
      }

      const { error } = await adminClient
        .from("emergency_identity_activations")
        .update({
          medical_records_count: state.medicalRecordsCount,
          emergency_profile_completed_at:
            state.profile?.blood_group && state.profile?.emergency_contact_name && state.profile?.emergency_contact_phone
              ? now
              : state.activation.emergency_profile_completed_at,
          validation_started_at: state.activation.validation_started_at ?? now,
          validation_completed_at: now,
          eligibility_status: eligibilityStatus,
          founding_member_id: foundingMemberId || null,
          founding_approved_at: eligibilityStatus === "approved" ? now : null,
        })
        .eq("user_id", user.id);

      if (error) return jsonResponse({ error: error.message }, 500);

      return jsonResponse({
        ok: true,
        status: eligibilityStatus,
        foundingMemberId: foundingMemberId || null,
        pricingMode: eligibilityStatus === "approved" ? "founding500" : "launch_offer",
      });
    }

    if (action === "create_order") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const state = await getProgressState(adminClient, user.id);
      const shipping = body.shipping as JsonRecord | undefined;
      if (!shipping) return jsonResponse({ error: "Shipping details are required." }, 400);

      const shippingPayload = {
        shipping_name: String(shipping.shipping_name ?? "").trim(),
        shipping_phone: normalizePhone(String(shipping.shipping_phone ?? "").trim()),
        shipping_line1: String(shipping.shipping_line1 ?? "").trim(),
        shipping_line2: String(shipping.shipping_line2 ?? "").trim(),
        shipping_city: String(shipping.shipping_city ?? "").trim(),
        shipping_state: String(shipping.shipping_state ?? "").trim(),
        shipping_pincode: String(shipping.shipping_pincode ?? "").trim(),
        shipping_country: String(shipping.shipping_country ?? DEFAULT_COUNTRY).trim() || DEFAULT_COUNTRY,
      };

      const requiredFields = Object.entries(shippingPayload).filter(([key, value]) =>
        key !== "shipping_line2" && !value,
      );
      if (requiredFields.length) {
        return jsonResponse({ error: "Complete the shipping address to continue." }, 400);
      }

      const { data: priorPaidOrder } = await adminClient
        .from("founding500_orders")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["paid", "fulfilled"])
        .maybeSingle();
      if (priorPaidOrder) return jsonResponse({ error: "Emergency kit already claimed for this account." }, 409);

      const verifiedPhone = String(state.profile?.phone ?? "");
      if (verifiedPhone) {
        const { data: duplicatePhoneClaim } = await adminClient
          .from("founding500_orders")
          .select("id, user_id")
          .eq("shipping_phone", verifiedPhone)
          .in("status", ["paid", "fulfilled"])
          .neq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (duplicatePhoneClaim) {
          return jsonResponse({ error: "This verified phone number has already been used for a completed claim." }, 409);
        }
      }

      const addressHash = await normalizeAddressHash(shippingPayload);
      const { data: duplicateAddress } = await adminClient
        .from("founding500_orders")
        .select("id, user_id")
        .eq("normalized_address_hash", addressHash)
        .in("status", ["paid", "fulfilled"])
        .neq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      const campaignClosed = state.campaignClosed;
      const pricingMode =
        state.activation.eligibility_status === "approved" && !campaignClosed ? "founding500" : "launch_offer";
      const originalPrice = Number(state.pricing.originalPrice);
      const discountedPrice = pricingMode === "founding500" ? 0 : Number(state.campaign.launch_price ?? 199);
      const shippingPrice = Number(state.pricing.shippingPrice);
      const totalAmount = discountedPrice + shippingPrice;
      const merchantOrderId = `CLK-ER-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
      const suspiciousFlag = Boolean(duplicateAddress);
      const suspiciousReason = duplicateAddress ? "Duplicate shipping address matched an earlier successful claim." : null;

      const insertPayload: JsonRecord = {
        campaign_slug: CAMPAIGN_SLUG,
        user_id: user.id,
        status: totalAmount > 0 ? "created" : "paid",
        pricing_mode: pricingMode,
        coupon_code: pricingMode === "founding500" ? "FOUNDING500" : null,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        shipping_price: shippingPrice,
        total_amount: totalAmount,
        merchant_order_id: merchantOrderId,
        shipping_name: shippingPayload.shipping_name,
        shipping_phone: shippingPayload.shipping_phone,
        shipping_line1: shippingPayload.shipping_line1,
        shipping_line2: shippingPayload.shipping_line2 || null,
        shipping_city: shippingPayload.shipping_city,
        shipping_state: shippingPayload.shipping_state,
        shipping_pincode: shippingPayload.shipping_pincode,
        shipping_country: shippingPayload.shipping_country,
        normalized_address_hash: addressHash,
        suspicious_flag: suspiciousFlag,
        suspicious_reason: suspiciousReason,
      };

      const { data: inserted, error: insertError } = await adminClient
        .from("founding500_orders")
        .insert(insertPayload)
        .select("*")
        .single();
      if (insertError || !inserted) return jsonResponse({ error: insertError?.message ?? "Unable to create order." }, 500);

      if (suspiciousFlag) {
        await adminClient
          .from("emergency_identity_activations")
          .update({
            suspicious_flag: true,
            suspicious_reason: suspiciousReason,
            admin_review_status: "review",
          })
          .eq("user_id", user.id);
      }

      if (totalAmount <= 0) {
        const completedAt = new Date().toISOString();
        await adminClient
          .from("founding500_orders")
          .update({
            status: "fulfilled",
            payment_verified_at: completedAt,
            completed_at: completedAt,
            cf_order_status: "PAID",
          })
          .eq("id", inserted.id);
        await adminClient
          .from("emergency_identity_activations")
          .update({ order_claimed_at: completedAt })
          .eq("user_id", user.id);
        return jsonResponse({
          ok: true,
          order: {
            ...inserted,
            status: "fulfilled",
          },
          checkoutMode: "internal",
        });
      }

      const cashfreeClientId = Deno.env.get("CASHFREE_CLIENT_ID");
      const cashfreeClientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET");
      const appBaseUrl = (Deno.env.get("PUBLIC_APP_URL") ?? "https://www.clinilocker.com").replace(/\/+$/, "");
      const cfBase = Deno.env.get("CASHFREE_BASE_URL") ?? "https://sandbox.cashfree.com/pg";
      const apiVersion = Deno.env.get("CASHFREE_API_VERSION") ?? "2025-01-01";

      if (!cashfreeClientId || !cashfreeClientSecret) {
        return jsonResponse({ error: "Cashfree secrets are not configured yet." }, 500);
      }

      const cfRequest = {
        order_id: merchantOrderId,
        order_amount: Number((totalAmount / 100).toFixed(2)),
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: shippingPayload.shipping_name,
          customer_phone: digitsPhone(shippingPayload.shipping_phone),
          customer_email: String(state.profile?.email ?? ""),
        },
        order_meta: {
          return_url: `${appBaseUrl}/patient/emergency-identity?cf_order_id=${merchantOrderId}`,
        },
        order_note: "Founding500 Emergency Kit Order",
        order_tags: {
          campaign: CAMPAIGN_SLUG,
          pricing_mode: pricingMode,
        },
      };

      const cfRes = await fetch(`${cfBase}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": cashfreeClientId,
          "x-client-secret": cashfreeClientSecret,
          "x-api-version": apiVersion,
          "x-request-id": crypto.randomUUID(),
          "x-idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify(cfRequest),
      });

      const cfData = await cfRes.json().catch(() => ({}));
      if (!cfRes.ok) {
        await adminClient.from("founding500_orders").update({ status: "failed" }).eq("id", inserted.id);
        return jsonResponse({
          error: cfData?.message ?? cfData?.error_description ?? "Cashfree order creation failed.",
          details: cfData,
        }, 500);
      }

      await adminClient
        .from("founding500_orders")
        .update({
          status: "awaiting_payment",
          cf_order_id: String(cfData.cf_order_id ?? ""),
          cf_payment_session_id: String(cfData.payment_session_id ?? ""),
          cf_order_status: String(cfData.order_status ?? "ACTIVE"),
        })
        .eq("id", inserted.id);

      return jsonResponse({
        ok: true,
        checkoutMode: "cashfree",
        paymentSessionId: cfData.payment_session_id,
        merchantOrderId,
        order: {
          ...inserted,
          status: "awaiting_payment",
        },
      });
    }

    if (action === "sync_order") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      const orderId = String(body.orderId ?? "").trim();
      if (!orderId) return jsonResponse({ error: "orderId is required." }, 400);

      const { data: order } = await adminClient
        .from("founding500_orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!order) return jsonResponse({ error: "Order not found." }, 404);

      if (order.total_amount <= 0 || order.status === "fulfilled") {
        return jsonResponse({ ok: true, order });
      }

      const cashfreeClientId = Deno.env.get("CASHFREE_CLIENT_ID");
      const cashfreeClientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET");
      const cfBase = Deno.env.get("CASHFREE_BASE_URL") ?? "https://sandbox.cashfree.com/pg";
      const apiVersion = Deno.env.get("CASHFREE_API_VERSION") ?? "2025-01-01";
      if (!cashfreeClientId || !cashfreeClientSecret) {
        return jsonResponse({ error: "Cashfree secrets are not configured yet." }, 500);
      }

      const res = await fetch(`${cfBase}/orders/${order.merchant_order_id}`, {
        headers: {
          "x-client-id": cashfreeClientId,
          "x-client-secret": cashfreeClientSecret,
          "x-api-version": apiVersion,
          "x-request-id": crypto.randomUUID(),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return jsonResponse({ error: data?.message ?? "Unable to verify payment status." }, 500);
      }

      const paid = String(data.order_status ?? "").toUpperCase() === "PAID";
      const now = new Date().toISOString();
      const nextStatus = paid ? "fulfilled" : order.status;

      await adminClient
        .from("founding500_orders")
        .update({
          status: nextStatus,
          cf_order_status: data.order_status ?? order.cf_order_status,
          payment_verified_at: paid ? now : order.payment_verified_at,
          completed_at: paid ? now : order.completed_at,
        })
        .eq("id", order.id);

      if (paid) {
        await adminClient
          .from("emergency_identity_activations")
          .update({ order_claimed_at: now })
          .eq("user_id", user.id);
      }

      return jsonResponse({ ok: true, paid, orderStatus: data.order_status, orderId: order.id });
    }

    if (action === "admin_dashboard") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      await requireAdmin(adminClient, user.id);
      const [campaign, activationsRes, ordersRes] = await Promise.all([
        getCampaign(adminClient),
        adminClient
          .from("emergency_identity_activations")
          .select("user_id, phone, medical_records_count, eligibility_status, founding_member_id, suspicious_flag, suspicious_reason, admin_review_status, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(100),
        adminClient
          .from("founding500_orders")
          .select("id, user_id, status, pricing_mode, total_amount, shipping_name, shipping_phone, shipping_city, shipping_state, shipping_pincode, suspicious_flag, suspicious_reason, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const [claimedCountRes, approvedCountRes, pendingValidationRes, suspiciousRes] = await Promise.all([
        adminClient.from("founding500_orders").select("id", { count: "exact", head: true }).in("status", ["paid", "fulfilled"]),
        adminClient.from("emergency_identity_activations").select("user_id", { count: "exact", head: true }).eq("eligibility_status", "approved"),
        adminClient.from("emergency_identity_activations").select("user_id", { count: "exact", head: true }).eq("eligibility_status", "under_validation"),
        adminClient.from("emergency_identity_activations").select("user_id", { count: "exact", head: true }).eq("suspicious_flag", true),
      ]);

      return jsonResponse({
        ok: true,
        campaign,
        analytics: {
          remainingSlots: Math.max(0, Number(campaign.max_free_claims ?? 500) - Number(claimedCountRes.count ?? 0)),
          kitsClaimed: Number(claimedCountRes.count ?? 0),
          eligibleUsers: Number(approvedCountRes.count ?? 0),
          pendingValidations: Number(pendingValidationRes.count ?? 0),
          suspiciousUsers: Number(suspiciousRes.count ?? 0),
        },
        activations: activationsRes.data ?? [],
        orders: ordersRes.data ?? [],
      });
    }

    if (action === "admin_review") {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
      await requireAdmin(adminClient, user.id);
      const targetUserId = String(body.userId ?? "").trim();
      const decision = String(body.decision ?? "").trim();
      const notes = String(body.notes ?? "").trim();
      if (!targetUserId || !decision) return jsonResponse({ error: "userId and decision are required." }, 400);

      const updatePayload: JsonRecord = {
        admin_review_status: decision,
        admin_notes: notes || null,
      };
      if (decision === "rejected") {
        updatePayload.eligibility_status = "revoked";
        updatePayload.revoked_at = new Date().toISOString();
        updatePayload.revoked_by = user.id;
      }
      if (decision === "approved") {
        updatePayload.suspicious_flag = false;
        updatePayload.suspicious_reason = null;
      }

      const { error } = await adminClient
        .from("emergency_identity_activations")
        .update(updatePayload)
        .eq("user_id", targetUserId);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unsupported action." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
