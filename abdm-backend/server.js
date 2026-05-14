import express from "express";
import {
  callGateway,
  createGatewaySession,
  deriveBaseUrl,
  extractAccessToken,
  getRequiredEnv,
  maskToken,
} from "./lib/gateway.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json());

function sendJson(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

function getBridgeBaseUrl(req) {
  return `${deriveBaseUrl(req)}/api/abdm`;
}

function getDefaultServicePayload(req) {
  const bridgeBaseUrl = getBridgeBaseUrl(req);

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

app.get("/", (req, res) => {
  sendJson(res, 200, {
    ok: true,
    service: "clinilocker-abdm-backend",
    endpoints: {
      health: `${deriveBaseUrl(req)}/api/abdm/health`,
      session: `${deriveBaseUrl(req)}/api/abdm/session`,
    },
  });
});

app.get("/api/abdm/health", (req, res) => {
  const env = getRequiredEnv();
  const baseUrl = deriveBaseUrl(req);

  sendJson(res, 200, {
    ok: true,
    service: "clinilocker-abdm-gateway",
    configured: env.isConfigured,
    gatewayBaseUrl: env.gatewayBaseUrl,
    xCmId: env.xCmId,
    sessionPath: env.sessionPath,
    bridgeBaseUrl: `${baseUrl}/api/abdm`,
    endpoints: {
      health: `${baseUrl}/api/abdm/health`,
      session: `${baseUrl}/api/abdm/session`,
      bridgeUrl: `${baseUrl}/api/abdm/bridge/url`,
      bridgeServices: `${baseUrl}/api/abdm/bridge/services`,
      bridgeTemplate: `${baseUrl}/api/abdm/bridge-template`,
      healthLockerRegistration: `${baseUrl}/api/abdm/health-locker/registration`,
    },
    note: "This confirms the Render ABDM backend routes are live.",
    timestamp: new Date().toISOString(),
  });
});

app.all("/api/abdm/session", async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  const env = getRequiredEnv();
  if (!env.isConfigured) {
    return sendJson(res, 500, {
      ok: false,
      error: "ABDM credentials are missing in Render environment variables.",
    });
  }

  try {
    const { parsed } = await createGatewaySession();
    const accessToken = extractAccessToken(parsed);
    const expiresIn = parsed?.expiresIn || parsed?.expires_in || null;

    return sendJson(res, 200, {
      ok: true,
      authenticated: Boolean(accessToken),
      tokenPreview: maskToken(accessToken),
      expiresIn,
      sessionPath: env.sessionPath,
      xCmId: env.xCmId,
      rawKeys: parsed && typeof parsed === "object" ? Object.keys(parsed) : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 502, {
      ok: false,
      error: error.message || "Unable to create ABDM gateway session.",
      details: error.details || null,
    });
  }
});

app.get("/api/abdm/bridge-template", (req, res) => {
  const baseUrl = deriveBaseUrl(req);
  const bridgeBaseUrl = `${baseUrl}/api/abdm`;
  const healthLockerServiceId = "clinilocker-health-locker";

  return sendJson(res, 200, {
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
});

app.all("/api/abdm/bridge/url", async (req, res) => {
  const bridgeBaseUrl = getBridgeBaseUrl(req);

  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      bridgeBaseUrl,
      payload: {
        url: bridgeBaseUrl,
      },
    });
  }

  if (req.method !== "PATCH" && req.method !== "POST") {
    res.setHeader("Allow", "GET, PATCH, POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
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

    return sendJson(res, 200, {
      ok: true,
      bridgeBaseUrl,
      gatewayResponse: result.parsed || result.rawText || null,
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "Unable to update ABDM bridge URL.",
      details: error.details || null,
    });
  }
});

app.all("/api/abdm/bridge/services", async (req, res) => {
  if (req.method === "GET") {
    try {
      const result = await callGateway("/gateway/v1/bridges/getServices", {
        method: "GET",
      });

      return sendJson(res, 200, {
        ok: true,
        services: result.parsed || null,
      });
    } catch (error) {
      return sendJson(res, error.statusCode || 500, {
        ok: false,
        error: error.message || "Unable to fetch ABDM bridge services.",
        details: error.details || null,
      });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
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

    return sendJson(res, 200, {
      ok: true,
      submitted: payload,
      gatewayResponse: result.parsed || result.rawText || null,
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "Unable to add or update ABDM bridge services.",
      details: error.details || null,
    });
  }
});

app.all("/api/abdm/health-locker/registration", (req, res) => {
  return sendJson(res, 200, {
    ok: true,
    service: "clinilocker-health-locker-registration",
    method: req.method,
    message:
      "CliniLocker HEALTH_LOCKER registration endpoint is live. This is the first callback endpoint to register against the ABDM sandbox bridge.",
    timestamp: new Date().toISOString(),
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`CliniLocker ABDM backend listening on port ${port}`);
});
