type Msg91CallbackData = Record<string, unknown>;

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
    sendOtp?: (
      identifier: string,
      success?: (data: Msg91CallbackData) => void,
      failure?: (error: unknown) => void,
    ) => void;
    verifyOtp?: (
      otp: string | number,
      success?: (data: Msg91CallbackData) => void,
      failure?: (error: unknown) => void,
      reqId?: string,
    ) => void;
    retryOtp?: (
      channel: string | null,
      success?: (data: Msg91CallbackData) => void,
      failure?: (error: unknown) => void,
      reqId?: string,
    ) => void;
  }
}

const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID as string | undefined;
const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH as string | undefined;
const SCRIPT_URLS = [
  "https://verify.msg91.com/otp-provider.js",
  "https://verify.phone91.com/otp-provider.js",
];

let scriptPromise: Promise<void> | null = null;
let initialized = false;
let lastSuccessPayload: Msg91CallbackData | null = null;
let lastFailurePayload: unknown = null;

function trimEnv(value: string | undefined) {
  return value?.trim() || "";
}

function getWidgetConfig() {
  return {
    widgetId: trimEnv(MSG91_WIDGET_ID),
    tokenAuth: trimEnv(MSG91_TOKEN_AUTH),
  };
}

export function isMsg91OtpConfigured() {
  const config = getWidgetConfig();
  return Boolean(config.widgetId && config.tokenAuth);
}

function loadScriptOnce(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    let index = 0;

    const attempt = () => {
      if (index >= SCRIPT_URLS.length) {
        reject(new Error("Unable to load MSG91 OTP SDK."));
        return;
      }

      const src = SCRIPT_URLS[index];
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existing) {
        if (typeof window.initSendOTP === "function") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => {
          index += 1;
          attempt();
        }, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        index += 1;
        attempt();
      };
      document.head.appendChild(script);
    };

    attempt();
  });

  return scriptPromise;
}

async function waitForWidgetMethods(timeoutMs = 2000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (typeof window.sendOtp === "function" && typeof window.verifyOtp === "function") {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  throw new Error("MSG91 OTP widget did not initialize properly.");
}

export async function ensureMsg91Widget() {
  if (!isMsg91OtpConfigured()) {
    throw new Error("MSG91 OTP is not configured yet.");
  }

  await loadScriptOnce();

  if (!initialized) {
    const { widgetId, tokenAuth } = getWidgetConfig();
    window.initSendOTP?.({
      widgetId,
      tokenAuth,
      exposeMethods: true,
      captchaRenderId: "emergency-identity-msg91-captcha",
      success: (data: unknown) => {
        lastSuccessPayload = asRecord(data);
      },
      failure: (error: unknown) => {
        lastFailurePayload = error;
      },
    });
    initialized = true;
  }

  await waitForWidgetMethods();
}

function parseMsg91Error(error: unknown) {
  if (!error) return "Unable to complete OTP verification right now.";
  if (typeof error === "string") return error;

  const record = error as Record<string, unknown>;
  const message =
    record.message ||
    record.error ||
    record.reason ||
    (record.data as Record<string, unknown> | undefined)?.message;

  return typeof message === "string" && message.trim()
    ? message
    : "Unable to complete OTP verification right now.";
}

function asRecord(value: unknown): Msg91CallbackData {
  return (value && typeof value === "object" ? value : {}) as Msg91CallbackData;
}

export async function sendMsg91Otp(identifier: string): Promise<Msg91CallbackData> {
  await ensureMsg91Widget();
  lastSuccessPayload = null;
  lastFailurePayload = null;

  return new Promise<Msg91CallbackData>((resolve, reject) => {
    window.sendOtp?.(
      identifier,
      (data) => {
        const parsed = asRecord(data);
        lastSuccessPayload = parsed;
        resolve(parsed);
      },
      (error) => reject(new Error(parseMsg91Error(error))),
    );
  });
}

export async function verifyMsg91Otp(otp: string, reqId?: string): Promise<Msg91CallbackData> {
  await ensureMsg91Widget();
  lastSuccessPayload = null;
  lastFailurePayload = null;

  return new Promise<Msg91CallbackData>((resolve, reject) => {
    window.verifyOtp?.(
      otp,
      (data) => {
        const parsed = asRecord(data);
        lastSuccessPayload = parsed;
        resolve(parsed);
      },
      (error) => reject(new Error(parseMsg91Error(error))),
      reqId,
    );
  });
}

export async function retryMsg91Otp(reqId?: string): Promise<Msg91CallbackData> {
  await ensureMsg91Widget();

  return new Promise<Msg91CallbackData>((resolve, reject) => {
    window.retryOtp?.(
      "11",
      (data) => resolve(asRecord(data)),
      (error) => reject(new Error(parseMsg91Error(error))),
      reqId,
    );
  });
}

export function extractMsg91ReqId(data: Msg91CallbackData) {
  const candidates = [
    data.reqId,
    data.req_id,
    (data.data as Record<string, unknown> | undefined)?.reqId,
    (data.data as Record<string, unknown> | undefined)?.req_id,
  ];

  const match = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof match === "string" ? match : null;
}

export function extractMsg91AccessToken(data: Msg91CallbackData) {
  const nested = (data.data as Record<string, unknown> | undefined) ?? {};
  const lastSuccessNested = ((lastSuccessPayload?.data as Record<string, unknown> | undefined) ?? {});
  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data["access-token"],
    data.jwt,
    nested.token,
    nested.accessToken,
    nested.access_token,
    nested["access-token"],
    nested.jwt,
    lastSuccessPayload?.token,
    lastSuccessPayload?.accessToken,
    lastSuccessPayload?.access_token,
    lastSuccessPayload?.["access-token"],
    lastSuccessPayload?.jwt,
    lastSuccessNested.token,
    lastSuccessNested.accessToken,
    lastSuccessNested.access_token,
    lastSuccessNested["access-token"],
    lastSuccessNested.jwt,
  ];

  const match = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof match === "string" ? match : null;
}
