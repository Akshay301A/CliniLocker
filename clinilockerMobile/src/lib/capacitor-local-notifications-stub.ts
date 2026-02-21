/**
 * Stub for @capacitor/local-notifications when the package is not installed
 * or when running in browser. Allows dev server to run without the native plugin.
 */

export const LocalNotifications = {
  requestPermissions: async () => ({ display: "denied" as const }),
  checkPermissions: async () => ({ display: "denied" as const }),
  schedule: async () => {},
  cancel: async () => {},
  cancelAll: async () => {},
  getPending: async () => ({ notifications: [] }),
  addActionPerformedListener: () => ({ remove: () => {} }),
};
