import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;

const SITE_URL = process.env.SITE_URL || "https://clinilocker.com";

/** Normalize phone for DB lookup: try with + and without (e.g. +919876543210 and 919876543210). */
function normalizePhone(waPhone: string): string[] {
  const digits = waPhone.replace(/\D/g, "");
  if (!digits.length) return [];
  const withPlus = digits.startsWith("91") ? `+${digits}` : `+91${digits}`;
  return [withPlus, digits, withPlus.replace("+", "")];
}

/** Send a text message via WhatsApp Cloud API. */
async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body },
    }),
  });
  return res.ok;
}

export default async function handler(req: any, res: any) {
  // Meta verification (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const challengeVal = Array.isArray(challenge) ? challenge[0] : challenge;
    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN && challengeVal) {
      return res.status(200).send(challengeVal);
    }
    return res.status(403).end();
  }

  // Incoming message (POST)
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const body = req.body as {
    object?: string;
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from: string;
            text?: { body: string };
            type: string;
          }>;
        };
      }>;
    }>;
  };

  if (body?.object !== "whatsapp_business_account") {
    return res.status(200).end();
  }

  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messages = value?.messages;
  const message = messages?.[0];

  if (!message?.from || message.type !== "text") {
    return res.status(200).end();
  }

  const from = message.from;
  const text = (message.text?.body || "").trim().toLowerCase();

  // Only react to "hi" or similar
  if (!text || !/^(hi|hello|hey|start|clini|clinilocker)$/i.test(text)) {
    await sendWhatsAppMessage(
      from,
      "Reply with *Hi* to get started with CliniLocker."
    );
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const phones = normalizePhone(from);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .in("phone", phones)
    .limit(1);

  const userExists = profiles && profiles.length > 0;

  if (userExists) {
    await sendWhatsAppMessage(
      from,
      `Welcome back! 👋\n\n*View my reports:* ${SITE_URL}/patient-login\n*Download reports:* ${SITE_URL}/patient/reports\n\nReply *Hi* anytime for this menu.`
    );
  } else {
    await sendWhatsAppMessage(
      from,
      `Hi! You're not registered yet.\n\n*Create your CliniLocker account* to view and download your health reports:\n${SITE_URL}/patient-login\n\nAfter signing up, reply *Hi* here for quick links.`
    );
  }

  return res.status(200).end();
}
