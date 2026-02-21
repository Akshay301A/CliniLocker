/**
 * Push (FCM/APNs) registration and token save.
 * Run only on native when user is authenticated as patient.
 */

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { savePushToken } from "./api";

export type Platform = "android" | "ios" | "web";

function getPlatform(): Platform {
  const p = Capacitor.getPlatform();
  if (p === "android" || p === "ios") return p;
  return "web";
}

/**
 * Request permission, register for push, and save FCM/APNs token to Supabase.
 * No-op on web or if permission denied. Call when patient is logged in.
 */
export async function registerPushAndSaveToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") {
      perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return;
    }

    const platform = getPlatform();

    const registrationListener = await PushNotifications.addListener(
      "registration",
      async (ev: { value: string }) => {
        const token = ev?.value;
        if (token) await savePushToken(token, platform);
      }
    );
    const errListener = await PushNotifications.addListener("registrationError", (err) => {
      console.warn("Push registration error:", err);
    });

    await PushNotifications.register();

    // Remove listeners after we get token (or give it a few seconds)
    setTimeout(() => {
      registrationListener.remove();
      errListener.remove();
    }, 15000);
  } catch (e) {
    console.warn("Push registration failed:", e);
  }
}
