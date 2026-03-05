import { Capacitor, registerPlugin } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

type ContactsPermissionState = "granted" | "denied" | "prompt";
type ContactsPermissionResult = {
  contacts?: ContactsPermissionState;
};
type ContactsPlugin = {
  checkPermissions: () => Promise<ContactsPermissionResult>;
  requestPermissions: () => Promise<ContactsPermissionResult>;
};

const Contacts = registerPlugin<ContactsPlugin>("Contacts");
const PERMISSIONS_KEY = "cl_native_permissions_v1";

async function requestNotificationPermission() {
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    perm = await PushNotifications.requestPermissions();
  }
}

async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // User denied or camera unavailable; skip hard-fail.
  }
}

async function requestContactsPermission() {
  try {
    const current = await Contacts.checkPermissions();
    if (current?.contacts !== "granted") {
      await Contacts.requestPermissions();
    }
  } catch {
    // Contacts plugin may not be installed yet. Keep app stable.
  }
}

export async function requestEssentialPermissionsOnce(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (localStorage.getItem(PERMISSIONS_KEY) === "1") return;

  await requestNotificationPermission();
  await requestCameraPermission();
  await requestContactsPermission();
  localStorage.setItem(PERMISSIONS_KEY, "1");
}

