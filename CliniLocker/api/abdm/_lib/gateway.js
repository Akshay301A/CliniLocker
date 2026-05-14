export const DEFAULT_GATEWAY_BASE_URL = "https://dev.abdm.gov.in";
export const DEFAULT_X_CM_ID = "sbx";

export function json(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

export function getRequiredEnv() {
  const clientId = process.env.ABDM_CLIENT_ID?.trim();
  const clientSecret = process.env.ABDM_CLIENT_SECRET?.trim();
  const gatewayBaseUrl = (process.env.ABDM_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL).trim().replace(/\/+$/, "");
  const xCmId = (process.env.ABDM_X_CM_ID || DEFAULT_X_CM_ID).trim();

  return {
    clientId,
    clientSecret,
    gatewayBaseUrl,
    xCmId,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export async function createGatewaySession() {
  const env = getRequiredEnv();

  if (!env.clientId || !env.clientSecret) {
    throw new Error("ABDM credentials are not configured.");
  }

  const response = await fetch(`${env.gatewayBaseUrl}/gateway/v0.5/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      "X-CM-ID": env.xCmId,
    },
    body: JSON.stringify({
      clientId: env.clientId,
      clientSecret: env.clientSecret,
    }),
  });

  const rawText = await response.text();
  let parsed;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      parsed?.error?.message ||
      parsed?.message ||
      rawText ||
      `ABDM gateway session failed with status ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.details = parsed || rawText || null;
    throw error;
  }

  return {
    response,
    parsed,
    rawText,
  };
}

export function maskToken(value) {
  if (!value || typeof value !== "string") return null;
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function deriveBaseUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "api.clinilocker.com";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}`;
}
