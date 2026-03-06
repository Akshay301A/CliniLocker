import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { getMobileAppUpdateConfig, type MobileAppUpdateConfig } from "@/lib/api";

export type AppUpdateCheckResult = {
  shouldUpdate: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  apkUrl: string;
  title: string;
  message: string;
};

function normalizeVersion(v: string): number[] {
  return v
    .split(".")
    .map((x) => Number(x.replace(/[^\d]/g, "")))
    .map((n) => (Number.isFinite(n) ? n : 0));
}

function compareVersions(a: string, b: string): number {
  const pa = normalizeVersion(a);
  const pb = normalizeVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function getDefaultMessage(currentVersion: string, latestVersion: string): string {
  return `A newer version is available. Current: v${currentVersion}. Latest: v${latestVersion}. Please update for the best experience.`;
}

const DEFAULT_APK_URL = "https://raw.githubusercontent.com/Akshay301A/CliniLocker/master/CliniLocker/public/downloads/CliniLocker-Android-v1.0.3-release.apk";
const ALLOWED_APK_HOSTS = new Set([
  "www.clinilocker.com",
  "clinilocker.com",
  "clinilocker.vercel.app",
  "raw.githubusercontent.com",
]);

function resolveApkUrl(rawUrl?: string): string {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) return DEFAULT_APK_URL;

  const normalized = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.startsWith("www.")
      ? `https://${trimmed}`
      : "";
  if (!normalized) return DEFAULT_APK_URL;

  try {
    const url = new URL(normalized);
    const protocol = url.protocol.toLowerCase();
    const host = url.hostname.toLowerCase();
    const path = (url.pathname || "").toLowerCase();
    const isAllowedHost = ALLOWED_APK_HOSTS.has(host);
    const isHttps = protocol === "https:";
    const isApkPath = path.endsWith(".apk");
    const isPlaceholderHost =
      host.includes("your-domain.com") ||
      host.includes("example.com") ||
      host.includes("localhost") ||
      host === "127.0.0.1";
    const isEmptyPath = !path || path === "/" || path === "/index.html";
    if (isPlaceholderHost || isEmptyPath || !isHttps || !isAllowedHost || !isApkPath) {
      return DEFAULT_APK_URL;
    }
    return url.toString();
  } catch {
    return DEFAULT_APK_URL;
  }
}

function buildResult(config: MobileAppUpdateConfig, currentVersion: string): AppUpdateCheckResult | null {
  const latestVersion = config.latest_version.trim();
  if (!latestVersion) return null;

  const apkUrl = resolveApkUrl(config.apk_url);

  const cmpLatest = compareVersions(currentVersion, latestVersion);
  const minSupported = config.min_supported_version?.trim();
  const forceByMin = minSupported ? compareVersions(currentVersion, minSupported) < 0 : false;
  const shouldUpdate = cmpLatest < 0;
  const forceUpdate = shouldUpdate && (config.force_update === true || forceByMin);

  return {
    shouldUpdate,
    forceUpdate,
    currentVersion,
    latestVersion,
    apkUrl,
    title: config.title || "Update Available",
    message: config.message || getDefaultMessage(currentVersion, latestVersion),
  };
}

/** Checks update requirement for Android native app using app_config.mobile_app_update. */
export async function checkForAppUpdate(): Promise<AppUpdateCheckResult | null> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return null;
  const [{ version: currentVersion }, config] = await Promise.all([
    CapacitorApp.getInfo(),
    getMobileAppUpdateConfig(),
  ]);
  if (!config) return null;
  const result = buildResult(config, currentVersion);
  if (!result || !result.shouldUpdate) return null;
  return result;
}

export async function openAppUpdateUrl(apkUrl: string): Promise<void> {
  await Browser.open({ url: resolveApkUrl(apkUrl) });
}
