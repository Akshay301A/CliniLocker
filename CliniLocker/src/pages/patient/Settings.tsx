import { useEffect, useState } from "react";
import { Bell, Download, Globe, Shield } from "lucide-react";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  getFamilyMembers,
  getLinkedLabs,
  getPatientReports,
  getProfile,
  getSignedUrl,
  updateProfile,
  type LinkedLab,
  type ReportWithLab,
} from "@/lib/api";

export type NotificationPrefs = {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  reportReady: boolean;
  healthTips: boolean;
  promotional: boolean;
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  sms: true,
  whatsapp: true,
  email: false,
  reportReady: true,
  healthTips: false,
  promotional: true,
};

const NOTIFICATION_KEYS_VISIBLE: (keyof NotificationPrefs)[] = ["sms", "reportReady", "healthTips", "promotional"];

function prefsFromProfile(
  profile: {
    notify_sms?: boolean;
    notify_whatsapp?: boolean;
    notify_email?: boolean;
    notify_report_ready?: boolean;
    notify_health_tips?: boolean;
    notify_promotional?: boolean;
  } | null,
): NotificationPrefs {
  if (!profile) return DEFAULT_NOTIFICATIONS;
  return {
    sms: profile.notify_sms ?? DEFAULT_NOTIFICATIONS.sms,
    whatsapp: profile.notify_whatsapp ?? DEFAULT_NOTIFICATIONS.whatsapp,
    email: profile.notify_email ?? DEFAULT_NOTIFICATIONS.email,
    reportReady: profile.notify_report_ready ?? DEFAULT_NOTIFICATIONS.reportReady,
    healthTips: profile.notify_health_tips ?? DEFAULT_NOTIFICATIONS.healthTips,
    promotional: profile.notify_promotional ?? DEFAULT_NOTIFICATIONS.promotional,
  };
}

const DEFAULT_PRIVACY = {
  twoFactorEnabled: true,
  reportSharingAllowed: true,
  profileVisibleToLabs: false,
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
];

export default function PatientSettings() {
  const { role } = useAuth();
  const { t, setLanguage: setLanguageContext } = useLanguage();
  const { activeView, setActiveView } = useViewMode();

  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [languageLoading, setLanguageLoading] = useState(false);
  const [linkedLabs, setLinkedLabs] = useState<LinkedLab[]>([]);
  const [linkedLabsLoading, setLinkedLabsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [downloadReportsLoading, setDownloadReportsLoading] = useState(false);
  const [switchProfileLoading, setSwitchProfileLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    getProfile().then((profile) => {
      if (!mounted) return;
      setNotifications(prefsFromProfile(profile));
      setNotificationsLoaded(true);
      if (profile) {
        setPrivacy({
          twoFactorEnabled: profile.two_factor_enabled ?? DEFAULT_PRIVACY.twoFactorEnabled,
          reportSharingAllowed: profile.report_sharing_allowed ?? DEFAULT_PRIVACY.reportSharingAllowed,
          profileVisibleToLabs: profile.profile_visible_to_labs ?? DEFAULT_PRIVACY.profileVisibleToLabs,
        });
        setPreferredLanguage(profile.preferred_language ?? "en");
      }
    });

    getLinkedLabs().then((labs) => {
      if (!mounted) return;
      setLinkedLabs(labs);
      setLinkedLabsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveNotifications = async () => {
    setNotificationsLoading(true);
    const result = await updateProfile({
      notify_sms: notifications.sms,
      notify_whatsapp: notifications.whatsapp,
      notify_email: notifications.email,
      notify_report_ready: notifications.reportReady,
      notify_health_tips: notifications.healthTips,
      notify_promotional: notifications.promotional,
    });
    setNotificationsLoading(false);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(t("Notification preferences saved."));
  };

  const handleSavePrivacy = async () => {
    setPrivacyLoading(true);
    const result = await updateProfile({
      two_factor_enabled: privacy.twoFactorEnabled,
      report_sharing_allowed: privacy.reportSharingAllowed,
      profile_visible_to_labs: privacy.profileVisibleToLabs,
    });
    setPrivacyLoading(false);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(t("Privacy & security preferences saved."));
  };

  const handleSaveLanguage = async () => {
    setLanguageLoading(true);
    const result = await updateProfile({ preferred_language: preferredLanguage });
    setLanguageLoading(false);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setLanguageContext(preferredLanguage);
    toast.success(t("Language saved. The app will use this language."));
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const [profile, reports, familyMembers] = await Promise.all([
        getProfile(),
        getPatientReports(),
        getFamilyMembers(),
      ]);
      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profile ?? null,
        reports: (reports ?? []).map((report) => ({
          id: report.id,
          test_name: report.test_name,
          patient_name: report.patient_name,
          uploaded_at: report.uploaded_at,
          test_date: report.test_date,
          lab_name: (report as ReportWithLab).labs?.name ?? null,
        })),
        familyMembers: familyMembers ?? [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clinilocker-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("Export downloaded."));
    } catch {
      toast.error(t("Export failed. Please try again."));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadAllReports = async () => {
    setDownloadReportsLoading(true);
    try {
      const reports = await getPatientReports();
      if (!reports.length) {
        toast.info(t("No reports to download."));
        setDownloadReportsLoading(false);
        return;
      }
      for (let i = 0; i < reports.length; i += 1) {
        const report = reports[i];
        const signedUrl = report.file_url ? await getSignedUrl(report.file_url) : null;
        if (signedUrl) {
          const link = document.createElement("a");
          link.href = signedUrl;
          link.download = `${(report.test_name || report.id).replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
          link.rel = "noopener noreferrer";
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        if (i < reports.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
      toast.success(reports.length === 1 ? t("Download started. Check your downloads.") : `${reports.length} ${t("reports")}. ${t("Check your downloads.")}`);
    } catch {
      toast.error(t("Download failed. Please try again."));
    } finally {
      setDownloadReportsLoading(false);
    }
  };

  const handleSwitchProfile = (checked: boolean) => {
    setSwitchProfileLoading(true);
    setActiveView(checked ? "doctor" : "patient");
    toast.success(checked ? t("Doctor View enabled.") : t("Patient View enabled."));
    setSwitchProfileLoading(false);
  };

  return (
    <PatientLayout>
      <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("Settings")}</h1>
          <p className="mt-1 text-muted-foreground">{t("Manage your account, privacy, and preferences.")}</p>
        </div>

        {role === "doctor" && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-950">{t("Switch Profile")}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t("Change between your Doctor workspace and your personal Patient View without signing out.")}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-blue-200 bg-white px-4 py-2">
                <span className={`text-sm font-medium ${activeView === "patient" ? "text-slate-950" : "text-slate-400"}`}>{t("Patient")}</span>
                <Switch checked={activeView === "doctor"} onCheckedChange={handleSwitchProfile} disabled={switchProfileLoading} />
                <span className={`text-sm font-medium ${activeView === "doctor" ? "text-slate-950" : "text-slate-400"}`}>{t("Doctor")}</span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Notifications")}</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: "sms" as const, label: t("Push Notifications"), desc: t("Receive notifications from the app. If enabled, you get push from the app; if disabled, you don't. Does not affect sign-in method.") },
              { key: "reportReady" as const, label: t("Report Ready Alerts"), desc: t("Get notified when a new report is available (from app)") },
              { key: "healthTips" as const, label: t("Health Tips"), desc: t("Receive weekly health tips from the app") },
              { key: "promotional" as const, label: t("Promotional Updates"), desc: t("Lab offers and discounts") },
            ]
              .filter((item) => NOTIFICATION_KEYS_VISIBLE.includes(item.key))
              .map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={notifications[item.key]} onCheckedChange={(value) => setNotifications((prev) => ({ ...prev, [item.key]: value }))} />
                </div>
              ))}
          </div>
          <Button variant="outline" onClick={handleSaveNotifications} disabled={!notificationsLoaded || notificationsLoading}>
            {notificationsLoading ? t("Saving...") : t("Save Preferences")}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Privacy & Security")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("Control how you sign in and what labs can see or do with your account. Your choices are saved and applied across the app.")}
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("Two-Factor Authentication (2FA)")}</p>
                <p className="text-xs text-muted-foreground">{t("When ON: we prefer stronger account security for your sign-in experience.")}</p>
              </div>
              <Switch checked={privacy.twoFactorEnabled} onCheckedChange={(value) => setPrivacy((prev) => ({ ...prev, twoFactorEnabled: value }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("Report Sharing")}</p>
                <p className="text-xs text-muted-foreground">When ON: labs you're linked with can add and share reports to your account. When OFF: they cannot link new reports to you.</p>
              </div>
              <Switch checked={privacy.reportSharingAllowed} onCheckedChange={(value) => setPrivacy((prev) => ({ ...prev, reportSharingAllowed: value }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("Profile Visibility to Labs")}</p>
                <p className="text-xs text-muted-foreground">When ON: linked labs can see your name and phone. When OFF: they see only what's needed to deliver your reports.</p>
              </div>
              <Switch checked={privacy.profileVisibleToLabs} onCheckedChange={(value) => setPrivacy((prev) => ({ ...prev, profileVisibleToLabs: value }))} />
            </div>
          </div>
          <Button variant="outline" onClick={handleSavePrivacy} disabled={privacyLoading}>
            {privacyLoading ? t("Saving...") : t("Save Preferences")}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Language")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("App content will be shown in your chosen language using Google Translate.")}
          </p>
          <div>
            <Label htmlFor="language">{t("Preferred language")}</Label>
            <select
              id="language"
              value={preferredLanguage}
              onChange={(event) => setPreferredLanguage(event.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={handleSaveLanguage} disabled={languageLoading}>
            {languageLoading ? t("Saving...") : t("Save language")}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Data Management")}</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleExportData} disabled={exportLoading}>
              <Download className="mr-2 h-4 w-4" /> {exportLoading ? t("Exporting...") : t("Export All Data")}
            </Button>
            <Button variant="outline" onClick={handleDownloadAllReports} disabled={downloadReportsLoading}>
              <Download className="mr-2 h-4 w-4" /> {downloadReportsLoading ? t("Preparing...") : t("Download All Reports")}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">{t("Linked Labs")}</h3>
          {linkedLabsLoading ? (
            <div className="text-sm text-muted-foreground">{t("Loading...")}</div>
          ) : linkedLabs.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("No linked labs yet. Labs will appear here once they upload reports for you.")}</div>
          ) : (
            <div className="space-y-3">
              {linkedLabs.map((lab) => (
                <div key={lab.lab_id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {lab.lab_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-foreground">{lab.lab_name}</span>
                      <span className="text-xs text-muted-foreground">{lab.reports_count} {lab.reports_count === 1 ? t("report") : t("reports")}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{t("Active")}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
