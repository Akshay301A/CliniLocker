import { json, createGatewaySession, getRequiredEnv, maskToken } from "./_lib/gateway.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const env = getRequiredEnv();
  if (!env.isConfigured) {
    return json(res, 500, {
      ok: false,
      error: "ABDM credentials are missing in Vercel environment variables.",
    });
  }

  try {
    const { parsed } = await createGatewaySession();
    const accessToken =
      parsed?.accessToken ||
      parsed?.token ||
      parsed?.access_token ||
      null;
    const expiresIn =
      parsed?.expiresIn ||
      parsed?.expires_in ||
      null;

    return json(res, 200, {
      ok: true,
      authenticated: Boolean(accessToken),
      tokenPreview: maskToken(accessToken),
      expiresIn,
      rawKeys: parsed && typeof parsed === "object" ? Object.keys(parsed) : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return json(res, error.statusCode || 502, {
      ok: false,
      error: error.message || "Unable to create ABDM gateway session.",
      details: error.details || null,
    });
  }
}
