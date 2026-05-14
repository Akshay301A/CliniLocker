export const DEFAULT_GATEWAY_BASE_URL = "https://dev.abdm.gov.in";
export const DEFAULT_X_CM_ID = "sbx";
export const DEFAULT_SESSION_PATH = "/gateway/v0.5/sessions";

export function json(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

export function getRequiredEnv() {
  const clientId = process.env.ABDM_CLIENT_ID?.trim();
  const clientSecret = process.env.ABDM_CLIENT_SECRET?.trim();
  const gatewayBaseUrl = (process.env.ABDM_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL).trim().replace(/\/+$/, "");
  const xCmId = (process.env.ABDM_X_CM_ID || DEFAULT_X_CM_ID).trim();
  const sessionPath = (process.env.ABDM_SESSION_PATH || DEFAULT_SESSION_PATH).trim();

  return {
    clientId,
    clientSecret,
    gatewayBaseUrl,
    xCmId,
    sessionPath,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function createGatewayRequestHeaders(extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    accept: "application/json",
    "REQUEST-ID": crypto.randomUUID(),
    TIMESTAMP: new Date().toISOString(),
    ...extraHeaders,
  };
}

export function extractAccessToken(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  return (
    parsed.accessToken ||
    parsed.access_token ||
    parsed.token ||
    parsed?.data?.accessToken ||
    parsed?.data?.access_token ||
    null
  );
}

export async function createGatewaySession() {
  const env = getRequiredEnv();

  if (!env.clientId || !env.clientSecret) {
    throw new Error("ABDM credentials are not configured.");
  }

  const response = await fetch(`${env.gatewayBaseUrl}${env.sessionPath}`, {
    method: "POST",
    headers: createGatewayRequestHeaders({
      "X-CM-ID": env.xCmId,
    }),
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

export async function callGateway(path, init = {}) {
  const env = getRequiredEnv();
  const { parsed } = await createGatewaySession();
  const accessToken = extractAccessToken(parsed);

  if (!accessToken) {
    throw new Error("ABDM gateway session succeeded but no access token was returned.");
  }

  const response = await fetch(`${env.gatewayBaseUrl}${path}`, {
    ...init,
    headers: createGatewayRequestHeaders({
      "X-CM-ID": env.xCmId,
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    }),
  });

  const rawText = await response.text();
  let parsedBody;
  try {
    parsedBody = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    const message =
      parsedBody?.error?.message ||
      parsedBody?.message ||
      rawText ||
      `ABDM gateway call failed with status ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.details = parsedBody || rawText || null;
    throw error;
  }

  return {
    response,
    parsed: parsedBody,
    rawText,
    accessToken,
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
