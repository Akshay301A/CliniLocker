/**
 * Medication Reminder Notifications Service
 * Uses Capacitor Local Notifications to schedule medication reminders
 */

import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

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
  durationDays?: number | null
): Promise<{ success: boolean; notificationIds: number[] }> {
  if (!Capacitor.isNativePlatform()) {
    console.log("Notifications only work on native platforms");
    return { success: false, notificationIds: [] };
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
  const start = new Date(startDate);
  const endDate = durationDays 
    ? new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  // Import API function for generating messages
  const { generateNotificationMessage } = await import("./api");

  // Schedule notification for each time
  for (let i = 0; i < times.length; i++) {
    const [hours, minutes] = times[i].split(":").map(Number);
    
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
    let notificationBody = `Time to take ${medicationName}${dosage ? ` (${dosage})` : ""}!`;
    try {
      const messageResult = await generateNotificationMessage(medicationName, dosage, timeOfDay);
      if (!("error" in messageResult)) {
        notificationBody = messageResult.message;
      }
    } catch (error) {
      console.warn("Failed to generate AI message, using default:", error);
      // Use default message if AI generation fails
    }

    // Generate unique ID from reminder ID and time index
    // Use a hash function to create stable IDs
    const hashString = reminderId + times[i];
    let hash = 0;
    for (let j = 0; j < hashString.length; j++) {
      const char = hashString.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const notificationId = Math.abs(hash) % 2147483647; // Max safe integer for notification IDs

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: "💊 Medication Reminder",
            body: notificationBody,
            schedule: {
              at: notificationTime,
              repeats: true, // Repeat daily
              every: "day",
            },
            sound: "default",
            attachments: undefined,
            actionTypeId: "MEDICATION_REMINDER",
            extra: {
              reminderId,
              medicationName,
              dosage,
              time: times[i],
            },
          },
        ],
      });

      notificationIds.push(notificationId);
    } catch (error) {
      console.error(`Failed to schedule notification for ${times[i]}:`, error);
    }
  }

  return { success: notificationIds.length > 0, notificationIds };
}

/**
 * Cancel all notifications for a reminder (uses same ID calculation as scheduleMedicationReminder)
 */
export async function cancelMedicationReminder(
  reminderId: string,
  times: string[]
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const notificationIds: number[] = [];
  for (let i = 0; i < times.length; i++) {
    const hashString = reminderId + times[i];
    let hash = 0;
    for (let j = 0; j < hashString.length; j++) {
      const char = hashString.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    notificationIds.push(Math.abs(hash) % 2147483647);
  }

  try {
    await LocalNotifications.cancel({ notifications: notificationIds.map((id) => ({ id })) });
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
