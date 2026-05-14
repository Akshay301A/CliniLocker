import { callGateway, deriveBaseUrl, json } from "../_lib/gateway.js";

function getDefaultServicePayload(req) {
  const bridgeBaseUrl = `${deriveBaseUrl(req)}/api/abdm`;

  return [
    {
      id: "clinilocker-health-locker",
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
  ];
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await callGateway("/gateway/v1/bridges/getServices", {
        method: "GET",
      });

      return json(res, 200, {
        ok: true,
        services: result.parsed || null,
      });
    } catch (error) {
      return json(res, error.statusCode || 500, {
        ok: false,
        error: error.message || "Unable to fetch ABDM bridge services.",
        details: error.details || null,
      });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const payload =
    Array.isArray(req.body) && req.body.length > 0
      ? req.body
      : getDefaultServicePayload(req);

  try {
    const result = await callGateway("/gateway/v1/bridges/addUpdateServices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return json(res, 200, {
      ok: true,
      submitted: payload,
      gatewayResponse: result.parsed || result.rawText || null,
    });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "Unable to add or update ABDM bridge services.",
      details: error.details || null,
    });
  }
}
