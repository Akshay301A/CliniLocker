# CliniLocker ABDM Backend

This is the standalone Render-ready backend for ABDM/ABHA gateway calls.

## Environment variables

- `ABDM_CLIENT_ID`
- `ABDM_CLIENT_SECRET`
- `ABDM_GATEWAY_BASE_URL=https://dev.abdm.gov.in`
- `ABDM_X_CM_ID=sbx`
- `ABDM_SESSION_PATH=/gateway/v0.5/sessions`
- `PUBLIC_BASE_URL`
  - Example on Render test URL:
    - `https://clinilocker-abdm.onrender.com`
  - Example after custom domain:
    - `https://api.clinilocker.com`

## Start command

```bash
npm install
npm start
```

## Routes

- `GET /api/abdm/health`
- `GET|POST /api/abdm/session`
- `GET /api/abdm/bridge-template`
- `GET|PATCH|POST /api/abdm/bridge/url`
- `GET|POST /api/abdm/bridge/services`
- `ANY /api/abdm/health-locker/registration`
