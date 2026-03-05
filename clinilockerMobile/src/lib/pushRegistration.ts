/**
 * Push (FCM/APNs) registration and token save.
 * Run only on native when user is authenticated as patient.
 */

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
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

/**
 * Handle remote push notification taps (FCM/APNs).
 * Returns cleanup function.
 */
export async function setupPushNotificationTapHandler(
  onTap: (payload: { route?: string; type?: string }) => void
): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {};
  const receivedListener = await PushNotifications.addListener("pushNotificationReceived", async (event) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: event?.title || "CliniLocker",
            body: event?.body || "You have a new health update.",
            channelId: "clinilocker_alerts",
            smallIcon: "ic_notification",
            largeIcon: "ic_launcher_round",
            iconColor: "#1E88E5",
            schedule: { at: new Date(Date.now() + 250) },
            sound: "default",
            extra: event?.data || {},
          },
        ],
      });
    } catch {
      // ignore notification mirror errors
    }
  });
  const listener = await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    const data = (event?.notification?.data ?? {}) as { route?: string; type?: string };
    onTap({ route: data.route, type: data.type });
  });
  return () => {
    listener.remove();
    receivedListener.remove();
  };
}
