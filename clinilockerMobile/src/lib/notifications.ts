/**
 * Medication Reminder Notifications Service
 * Uses Capacitor Local Notifications to schedule medication reminders
 */

import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const ALERTS_CHANNEL_ID = "clinilocker_alerts";
const HEALTH_TIP_NOTIFICATION_ID = 190000001;
const DEFAULT_HEALTH_TIP_TIME = { hour: 9, minute: 0 };

/**
 * Ensure Android notification channel is high importance for heads-up popups.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  try {
    await LocalNotifications.createChannel({
      id: ALERTS_CHANNEL_ID,
      name: "CliniLocker Alerts",
      description: "Critical health reminders and report updates",
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: "default",
      lights: true,
      lightColor: "#1E88E5",
    });
  } catch (error) {
    console.warn("LocalNotifications channel setup failed:", error);
  }

  try {
    await PushNotifications.createChannel({
      id: ALERTS_CHANNEL_ID,
      name: "CliniLocker Alerts",
      description: "Critical health reminders and report updates",
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: "default",
      lights: true,
      lightColor: "#1E88E5",
    });
  } catch (error) {
    console.warn("PushNotifications channel setup failed:", error);
  }
}

export interface ScheduledNotification {
  id: number;
  title: string;
  body: string;
  schedule: {
    at: Date;
    repeats?: boolean;
    every?: "day" | "week" | "month" | "year";
  };
}

const DEFAULT_REMINDER_OFFSETS = [-10, -5, 0] as const;
const REMINDER_SETTINGS_KEY = "clinilocker_reminder_offsets_v1";

type ReminderVariant = string;

function buildReminderNotificationId(reminderId: string, time: string, variant: ReminderVariant): number {
  const hashString = `${reminderId}|${time}|${variant}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}

function normalizeOffsets(offsets?: number[]): number[] {
  const source = Array.isArray(offsets) && offsets.length > 0 ? offsets : [...DEFAULT_REMINDER_OFFSETS];
  return Array.from(new Set(source.filter((n) => Number.isFinite(n) && n <= 0 && n >= -180)))
    .sort((a, b) => a - b);
}

function offsetVariant(offset: number): ReminderVariant {
  if (offset === 0) return "on_time";
  return `before_${Math.abs(offset)}m`;
}

export function getReminderNotificationOffsets(reminderId: string): number[] {
  if (typeof localStorage === "undefined") return [...DEFAULT_REMINDER_OFFSETS];
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
    return normalizeOffsets(parsed[reminderId]);
  } catch {
    return [...DEFAULT_REMINDER_OFFSETS];
  }
}

export function setReminderNotificationOffsets(reminderId: string, offsets: number[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
    parsed[reminderId] = normalizeOffsets(offsets);
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(parsed));
  } catch {
    // ignore local storage failures
  }
}

export function clearReminderNotificationOffsets(reminderId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    delete parsed[reminderId];
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(parsed));
  } catch {
    // ignore local storage failures
  }
}

function buildFallbackReminderBody(medicationName: string, dosage: string, timeOfDay: string): string {
  const dose = dosage ? ` (${dosage})` : "";
  if (timeOfDay === "morning") return `Good morning. Time for ${medicationName}${dose}.`;
  if (timeOfDay === "afternoon") return `Friendly reminder: please take ${medicationName}${dose}.`;
  if (timeOfDay === "evening") return `Hope your day went well. It's time for ${medicationName}${dose}.`;
  if (timeOfDay === "night") return `Before you rest, please take ${medicationName}${dose}.`;
  return `Time to take ${medicationName}${dose}.`;
}

/**
 * Request notification permissions (required for Android/iOS)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log("Notifications only work on native platforms");
    return false;
  }

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch (error) {
    console.error("Failed to request notification permissions:", error);
    return false;
  }
}

/**
 * Check if notifications are enabled
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === "granted";
  } catch (error) {
    console.error("Failed to check notification permissions:", error);
    return false;
  }
}

/**
 * Schedule a medication reminder notification with AI-generated fun messages
 */
export async function scheduleMedicationReminder(
  reminderId: string,
  medicationName: string,
  dosage: string,
  times: string[],
  startDate: string,
  durationDays?: number | null,
  options?: { offsets?: number[] }
): Promise<{ success: boolean; notificationIds: number[] }> {
  if (!Capacitor.isNativePlatform()) {
    console.log("Notifications only work on native platforms");
    return { success: false, notificationIds: [] };
  }

  try {
    const { getProfile } = await import("./api");
    const profile = await getProfile();
    if (profile?.notify_sms === false) {
      return { success: false, notificationIds: [] };
    }
  } catch {
    // ignore profile check failures and continue scheduling
  }

  // Check permissions first
  const hasPermission = await checkNotificationPermissions();
  if (!hasPermission) {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      console.warn("Notification permissions not granted");
      return { success: false, notificationIds: [] };
    }
  }

  const notificationIds: number[] = [];
  const today = new Date();
  void startDate;
  void durationDays;
  const offsets = normalizeOffsets(options?.offsets ?? getReminderNotificationOffsets(reminderId));

  const normalizedTimes = Array.from(new Set((times ?? []).map((t) => t.trim()).filter(Boolean)));
  if (normalizedTimes.length === 0) return { success: false, notificationIds: [] };

  // Defensive de-duplication: always clear existing schedules for this reminder before recreating.
  await cancelMedicationReminder(reminderId, normalizedTimes, offsets);

  // Import API function for generating messages
  const { generateNotificationMessage } = await import("./api");

  // Schedule notification for each time
  for (let i = 0; i < normalizedTimes.length; i++) {
    const timeSlot = normalizedTimes[i];
    const [hours, minutes] = timeSlot.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;
    
    // Calculate next occurrence
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (notificationTime < today) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    // Determine time of day for context
    let timeOfDay = "now";
    if (hours >= 5 && hours < 12) {
      timeOfDay = "morning";
    } else if (hours >= 12 && hours < 17) {
      timeOfDay = "afternoon";
    } else if (hours >= 17 && hours < 21) {
      timeOfDay = "evening";
    } else {
      timeOfDay = "night";
    }

    // Generate fun notification message using AI
    let notificationBody = buildFallbackReminderBody(medicationName, dosage, timeOfDay);
    try {
      const messageResult = await generateNotificationMessage(medicationName, dosage, timeOfDay);
      if (!("error" in messageResult)) {
        notificationBody = messageResult.message;
      }
    } catch (error) {
      console.warn("Failed to generate AI message, using default:", error);
      // Use default message if AI generation fails
    }

    const plans: Array<{ variant: ReminderVariant; offsetMinutes: number; title: string; body: string }> = offsets.map((offset) => {
      if (offset === 0) {
        return {
          variant: offsetVariant(offset),
          offsetMinutes: 0,
          title: "Medication Reminder",
          body: notificationBody,
        };
      }
      return {
        variant: offsetVariant(offset),
        offsetMinutes: offset,
        title: "Medication Reminder",
        body: `In ${Math.abs(offset)} minutes: ${medicationName}${dosage ? ` (${dosage})` : ""}.`,
      };
    });

    for (const plan of plans) {
      const triggerAt = new Date(notificationTime.getTime() + plan.offsetMinutes * 60 * 1000);
      if (triggerAt < today) {
        triggerAt.setDate(triggerAt.getDate() + 1);
      }

      const notificationId = buildReminderNotificationId(reminderId, timeSlot, plan.variant);

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: plan.title,
              body: plan.body,
              channelId: ALERTS_CHANNEL_ID,
              smallIcon: "ic_notification",
              largeIcon: "ic_launcher_round",
              iconColor: "#1E88E5",
              schedule: {
                at: triggerAt,
                repeats: true,
                every: "day",
              },
              sound: "default",
              attachments: undefined,
              actionTypeId: "MEDICATION_REMINDER",
              extra: {
                reminderId,
                medicationName,
                dosage,
                time: timeSlot,
                variant: plan.variant,
              },
            },
          ],
        });
        notificationIds.push(notificationId);
      } catch (error) {
        console.error(`Failed to schedule ${plan.variant} notification for ${timeSlot}:`, error);
      }
    }
  }

  return { success: notificationIds.length > 0, notificationIds };
}

/**
 * Cancel all notifications for a reminder (uses same ID calculation as scheduleMedicationReminder)
 */
export async function cancelMedicationReminder(
  reminderId: string,
  times: string[],
  offsets?: number[]
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const normalizedTimes = Array.from(new Set((times ?? []).map((t) => t.trim()).filter(Boolean)));
  const notificationIds = new Set<number>();
  const effectiveOffsets = normalizeOffsets(offsets ?? getReminderNotificationOffsets(reminderId));
  const knownOffsets = Array.from(new Set([...DEFAULT_REMINDER_OFFSETS, ...effectiveOffsets]));
  for (const time of normalizedTimes) {
    for (const offset of knownOffsets) {
      notificationIds.add(buildReminderNotificationId(reminderId, time, offsetVariant(offset)));
    }
    // Legacy ids from earlier builds.
    notificationIds.add(buildReminderNotificationId(reminderId, time, "before"));
    notificationIds.add(buildReminderNotificationId(reminderId, time, "on_time"));
  }

  try {
    const pending = await LocalNotifications.getPending();
    for (const n of pending.notifications ?? []) {
      const extra = (n.extra ?? {}) as { reminderId?: string };
      if (extra.reminderId === reminderId && typeof n.id === "number") {
        notificationIds.add(n.id);
      }
    }

    if (notificationIds.size === 0) return;
    await LocalNotifications.cancel({ notifications: Array.from(notificationIds).map((id) => ({ id })) });
  } catch (error) {
    console.error("Failed to cancel notifications:", error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await LocalNotifications.cancelAll();
  } catch (error) {
    console.error("Failed to cancel all notifications:", error);
  }
}

function nextDailyOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}

/** Schedule daily AI health tip notification (one recurring slot). */
export async function scheduleHealthTipNotification(language = "en"): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const hasPermission = await checkNotificationPermissions();
  if (!hasPermission) {
    const granted = await requestNotificationPermissions();
    if (!granted) return;
  }

  const { generateHealthTipMessage } = await import("./api");
  const ai = await generateHealthTipMessage(language);
  const body = "error" in ai
    ? "Small healthy steps every day lead to big results. Stay hydrated and stay active."
    : ai.message;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: HEALTH_TIP_NOTIFICATION_ID }] });
  } catch {
    // ignore
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: HEALTH_TIP_NOTIFICATION_ID,
        title: "Daily Health Tip",
        body,
        channelId: ALERTS_CHANNEL_ID,
        smallIcon: "ic_notification",
        largeIcon: "ic_launcher_round",
        iconColor: "#1E88E5",
        schedule: {
          at: nextDailyOccurrence(DEFAULT_HEALTH_TIP_TIME.hour, DEFAULT_HEALTH_TIP_TIME.minute),
          repeats: true,
          every: "day",
        },
        sound: "default",
        extra: {
          type: "health_tip",
          route: "/patient/dashboard",
        },
      },
    ],
  });
}

export async function cancelHealthTipNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: HEALTH_TIP_NOTIFICATION_ID }] });
  } catch {
    // ignore
  }
}

/**
 * Get all pending notifications
 */
export async function getPendingNotifications(): Promise<any[]> {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  try {
    const result = await LocalNotifications.getPending();
    return result.notifications || [];
  } catch (error) {
    console.error("Failed to get pending notifications:", error);
    return [];
  }
}

/**
 * Handle notification tap (when user taps notification)
 */
export function setupNotificationHandlers(
  onNotificationTap: (data: { reminderId: string; medicationName: string; dosage: string }) => void
): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const listener = LocalNotifications.addActionPerformedListener((notification) => {
    const extra = notification.notification.extra;
    if (extra?.reminderId) {
      onNotificationTap({
        reminderId: extra.reminderId,
        medicationName: extra.medicationName || "",
        dosage: extra.dosage || "",
      });
    }
  });

  return () => {
    listener.remove();
  };
}

