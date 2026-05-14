import { json, getRequiredEnv, deriveBaseUrl } from "./_lib/gateway.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const env = getRequiredEnv();
  const baseUrl = deriveBaseUrl(req);

  return json(res, 200, {
    ok: true,
    service: "clinilocker-abdm-gateway",
    configured: env.isConfigured,
    gatewayBaseUrl: env.gatewayBaseUrl,
    xCmId: env.xCmId,
    bridgeBaseUrl: `${baseUrl}/api/abdm`,
    endpoints: {
      health: `${baseUrl}/api/abdm/health`,
      session: `${baseUrl}/api/abdm/session`,
      bridgeTemplate: `${baseUrl}/api/abdm/bridge-template`,
      healthLockerRegistration: `${baseUrl}/api/abdm/health-locker/registration`,
    },
    note: "This confirms the Vercel ABDM backend routes are live. Session route tests gateway auth using your sandbox bridge credentials.",
    timestamp: new Date().toISOString(),
  });
}
