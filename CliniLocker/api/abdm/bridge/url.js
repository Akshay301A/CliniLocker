import { callGateway, deriveBaseUrl, json } from "../_lib/gateway.js";

function getBridgeBaseUrl(req) {
  return `${deriveBaseUrl(req)}/api/abdm`;
}

export default async function handler(req, res) {
  const bridgeBaseUrl = getBridgeBaseUrl(req);

  if (req.method === "GET") {
    return json(res, 200, {
      ok: true,
      bridgeBaseUrl,
      payload: {
        url: bridgeBaseUrl,
      },
    });
  }

  if (req.method !== "PATCH" && req.method !== "POST") {
    res.setHeader("Allow", "GET, PATCH, POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    const result = await callGateway("/gateway/v1/bridges", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: bridgeBaseUrl,
      }),
    });

    return json(res, 200, {
      ok: true,
      bridgeBaseUrl,
      gatewayResponse: result.parsed || result.rawText || null,
    });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "Unable to update ABDM bridge URL.",
      details: error.details || null,
    });
  }
}
