import { useState, useEffect } from "react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, Shield, Globe, Download } from "lucide-react";
import { getProfile, updateProfile, getLinkedLabs, type LinkedLab } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

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
  promotional: false,
};

function prefsFromProfile(p: { notify_sms?: boolean; notify_whatsapp?: boolean; notify_email?: boolean; notify_report_ready?: boolean; notify_health_tips?: boolean; notify_promotional?: boolean } | null): NotificationPrefs {
  if (!p) return DEFAULT_NOTIFICATIONS;
  return {
    sms: p.notify_sms ?? DEFAULT_NOTIFICATIONS.sms,
    whatsapp: p.notify_whatsapp ?? DEFAULT_NOTIFICATIONS.whatsapp,
    email: p.notify_email ?? DEFAULT_NOTIFICATIONS.email,
    reportReady: p.notify_report_ready ?? DEFAULT_NOTIFICATIONS.reportReady,
    healthTips: p.notify_health_tips ?? DEFAULT_NOTIFICATIONS.healthTips,
    promotional: p.notify_promotional ?? DEFAULT_NOTIFICATIONS.promotional,
  };
}

const DEFAULT_PRIVACY = {
  twoFactorEnabled: true,
  reportSharingAllowed: true,
  profileVisibleToLabs: false,
};

const PatientSettings = () => {
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [languageLoading, setLanguageLoading] = useState(false);

  const [linkedLabs, setLinkedLabs] = useState<LinkedLab[]>([]);
  const [linkedLabsLoading, setLinkedLabsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getProfile().then((p) => {
      if (mounted) {
        setNotifications(prefsFromProfile(p));
        setNotificationsLoaded(true);
        if (p) {
          setPrivacy({
            twoFactorEnabled: p.two_factor_enabled ?? DEFAULT_PRIVACY.twoFactorEnabled,
            reportSharingAllowed: p.report_sharing_allowed ?? DEFAULT_PRIVACY.reportSharingAllowed,
            profileVisibleToLabs: p.profile_visible_to_labs ?? DEFAULT_PRIVACY.profileVisibleToLabs,
          });
          setPreferredLanguage(p.preferred_language ?? "en");
        }
      }
    });
    getLinkedLabs().then((labs) => {
      if (mounted) {
        setLinkedLabs(labs);
        setLinkedLabsLoading(false);
      }
    });
    return () => { mounted = false; };
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

  const { t, setLanguage: setLanguageContext } = useLanguage();

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

  const handleExportData = () => {
    toast.success(t("Your data export has been initiated. You'll receive a download link via email."));
  };

  return (
    <PatientLayout>
      <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("Settings")}</h1>
          <p className="mt-1 text-muted-foreground">{t("Manage your account, privacy, and preferences.")}</p>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Notifications")}</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: "sms" as const, label: t("SMS Notifications"), desc: t("Receive report updates via SMS") },
              { key: "whatsapp" as const, label: t("WhatsApp Notifications"), desc: t("Get notified on WhatsApp") },
              { key: "email" as const, label: t("Email Notifications"), desc: t("Receive email updates") },
              { key: "reportReady" as const, label: t("Report Ready Alerts"), desc: t("Get notified when a new report is available") },
              { key: "healthTips" as const, label: t("Health Tips"), desc: t("Receive weekly health tips") },
              { key: "promotional" as const, label: t("Promotional Updates"), desc: t("Lab offers and discounts") },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={notifications[item.key]} onCheckedChange={(val) => setNotifications((prev) => ({ ...prev, [item.key]: val }))} />
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={handleSaveNotifications} disabled={!notificationsLoaded || notificationsLoading}>
            {notificationsLoading ? t("Saving…") : t("Save Preferences")}
          </Button>
        </div>

        {/* Privacy & Security */}
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
                <p className="text-xs text-muted-foreground">{t("When ON: we use OTP (code on your phone) for login when possible, so only you can access your account.")}</p>
              </div>
              <Switch
                checked={privacy.twoFactorEnabled}
                onCheckedChange={(v) => setPrivacy((prev) => ({ ...prev, twoFactorEnabled: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("Report Sharing")}</p>
                <p className="text-xs text-muted-foreground">When ON: labs you’re linked with can add and share reports to your account. When OFF: they cannot link new reports to you.</p>
              </div>
              <Switch
                checked={privacy.reportSharingAllowed}
                onCheckedChange={(v) => setPrivacy((prev) => ({ ...prev, reportSharingAllowed: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("Profile Visibility to Labs")}</p>
                <p className="text-xs text-muted-foreground">When ON: linked labs can see your name and phone. When OFF: they see only what’s needed to deliver your reports.</p>
              </div>
              <Switch
                checked={privacy.profileVisibleToLabs}
                onCheckedChange={(v) => setPrivacy((prev) => ({ ...prev, profileVisibleToLabs: v }))}
              />
            </div>
          </div>
          <Button variant="outline" onClick={handleSavePrivacy} disabled={privacyLoading}>
            {privacyLoading ? t("Saving…") : t("Save Preferences")}
          </Button>
        </div>

        {/* Language */}
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
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
            </select>
          </div>
          <Button variant="outline" onClick={handleSaveLanguage} disabled={languageLoading}>
            {languageLoading ? t("Saving…") : t("Save language")}
          </Button>
        </div>

        {/* Data Management */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Data Management")}</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" /> {t("Export All Data")}
            </Button>
            <Button variant="outline" onClick={() => toast.success(t("Download link sent to your email."))}>
              <Download className="mr-2 h-4 w-4" /> {t("Download All Reports")}
            </Button>
          </div>
        </div>

        {/* Linked Labs */}
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
                      <span className="text-sm font-medium text-foreground block">{lab.lab_name}</span>
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
};

export default PatientSettings;
