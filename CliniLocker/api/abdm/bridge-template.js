import { json, deriveBaseUrl } from "./_lib/gateway.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const baseUrl = deriveBaseUrl(req);
  const bridgeBaseUrl = `${baseUrl}/api/abdm`;
  const healthLockerServiceId = "clinilocker-health-locker";

  return json(res, 200, {
    ok: true,
    bridgeUrlPatch: {
      method: "PATCH",
      url: "https://dev.abdm.gov.in/gateway/v1/bridges",
      body: {
        url: bridgeBaseUrl,
      },
    },
    addUpdateServicesPayload: [
      {
        id: healthLockerServiceId,
        name: "CliniLocker Health Locker",
        type: "HEALTH_LOCKER",
        active: true,
        alias: ["clinilocker-health-locker"],
        endpoints: [
          {
            address: `${bridgeBaseUrl}/health-locker/registration`,
            connectionType: "https",
            use: "registration",
          },
        ],
      },
    ],
    nextStep:
      "After session auth works, use this payload to update the bridge URL and register the HEALTH_LOCKER service with ABDM sandbox.",
  });
}
