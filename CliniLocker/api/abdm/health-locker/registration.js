import { json } from "../_lib/gateway.js";

export default async function handler(req, res) {
  return json(res, 200, {
    ok: true,
    service: "clinilocker-health-locker-registration",
    method: req.method,
    message:
      "CliniLocker HEALTH_LOCKER registration endpoint is live. This is the first callback endpoint to register against the ABDM sandbox bridge.",
    timestamp: new Date().toISOString(),
  });
}
