import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Users, TrendingUp, Calendar, Shield, Sparkles, Heart, Tag, Megaphone, Building2, Stethoscope, Pill, Bell, Clock } from "lucide-react";
import { Preloader } from "@/components/Preloader";
import { PatientLayout } from "@/components/PatientLayout";
import { AdSense } from "@/components/AdSense";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getPatientReports, getFamilyMembers, getProfile, getMedicationReminders, getShowAds } from "@/lib/api";
import { fetchHealthQuotes } from "@/lib/healthQuotes";
import type { ReportWithLab } from "@/lib/api";
import { toast } from "sonner";

// Feature flags - set to true when labs are added
const SHOW_LAB_OFFERS = false;
const SHOW_FEATURED_ADS = false;
const SHOW_SCHEDULE_CHECKUP = false;

function formatDate(s: string | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

/** First name from full_name, or full name, or fallback. */
function displayName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "there";
  const parts = fullName.trim().split(/\s+/);
  return parts[0] ?? "there";
}

/** Real health tips everyone should follow – shown in rotation at bottom of dashboard. */
const REAL_HEALTH_TIPS = [
  "Get 7–8 hours of sleep each night for better focus and immunity.",
  "Drink at least 8 glasses of water daily to stay hydrated.",
  "Wash your hands before meals and after using the restroom.",
  "Get an annual health check-up and keep your vaccination records up to date.",
  "Eat a balanced diet with plenty of fruits and vegetables.",
  "Aim for at least 30 minutes of physical activity most days.",
  "Limit screen time before bed for better sleep quality.",
  "Don’t skip breakfast – it helps energy and concentration.",
  "Use sunscreen with SPF 30+ when you’re outdoors.",
  "Brush your teeth twice daily and floss once a day.",
  "Take short breaks from sitting every hour if you work at a desk.",
  "Manage stress with relaxation, exercise, or talking to someone.",
  "Avoid smoking and limit alcohol for long-term health.",
  "Know your numbers: blood pressure, weight, and blood sugar when advised.",
  "Store and take medicines as prescribed; don’t share them.",
];

const FALLBACK_HEALTH_QUOTES = [
  "Small daily steps build strong long-term health.",
  "Your future self will thank you for today's healthy choices.",
  "Consistency in sleep, food, and movement is powerful medicine.",
  "Track your health reports regularly to stay one step ahead.",
  "A calm mind and active body are a strong combination.",
  "Prevention is always better than emergency treatment.",
];

const TIP_ROTATE_MS = 30 * 1000;
const TODAY_WELLNESS = "Today";

type ReminderPreview = {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  notes?: string | null;
  times?: string[] | null;
  is_active?: boolean;
};

const PatientDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportWithLab[]>([]);
  const [familyCount, setFamilyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [bloodPressure, setBloodPressure] = useState<string | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [healthQuotes, setHealthQuotes] = useState<string[]>([]);
  const [healthQuoteIndex, setHealthQuoteIndex] = useState(0);
  const [healthTipIndex, setHealthTipIndex] = useState(0);
  const [reminders, setReminders] = useState<ReminderPreview[]>([]);
  const [showAds, setShowAds] = useState(false);
  const metadataFullName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;

  useEffect(() => {
    let mounted = true;
    Promise.all([getPatientReports(), getFamilyMembers(), getProfile(), getMedicationReminders()]).then(([r, f, p, rem]) => {
      if (mounted) {
        setReports(r);
        setFamilyCount(f.length);
        setUserName(p?.full_name ?? null);
        setBloodPressure(p?.blood_pressure ?? null);
        setWeight(p?.weight ?? null);
        setReminders(rem || []);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loading || !user?.id) return;
    const key = `welcome_dashboard_patient_${user.id}`;
    if (sessionStorage.getItem(key) === "1") return;
    const name = displayName(userName ?? metadataFullName);
    toast.success(`Welcome ${name}!`, {
      description: "Your health vault is ready. Stay healthy and keep going!",
    });
    sessionStorage.setItem(key, "1");
  }, [loading, metadataFullName, user?.id, userName]);

  useEffect(() => {
    let mounted = true;
    fetchHealthQuotes().then((quotes) => {
      if (mounted) setHealthQuotes(quotes);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthQuoteIndex((i) => {
        const quoteCount = (healthQuotes.length > 0 ? healthQuotes : FALLBACK_HEALTH_QUOTES).length;
        return (i + 1) % quoteCount;
      });
      setHealthTipIndex((i) => (i + 1) % REAL_HEALTH_TIPS.length);
    }, TIP_ROTATE_MS);
    return () => clearInterval(interval);
  }, [healthQuotes]);

  useEffect(() => {
    let mounted = true;
    getShowAds().then((v) => {
      if (mounted) setShowAds(v);
    });
    return () => { mounted = false; };
  }, []);

  const recentReports = reports.slice(0, 3);
  const lastReport = reports[0];
  const lastCheckup = lastReport?.uploaded_at ? formatDate(lastReport.uploaded_at) : "—";
  const activeQuotes = healthQuotes.length > 0 ? healthQuotes : FALLBACK_HEALTH_QUOTES;
  const activeQuote = activeQuotes[healthQuoteIndex % activeQuotes.length];

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-4 md:space-y-5 pb-6">
        {/* Welcome Card - Enhanced Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-5 md:p-6 shadow-lg">
          <div className="relative z-10">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
              {t("Welcome back")}, {displayName(userName ?? undefined)}!
            </h1>
            <p className="text-blue-50 text-sm md:text-base leading-relaxed">{t("Your health reports are safe and accessible anytime.")}</p>
            <div className="mt-5 pt-5 border-t border-blue-400/40">
              <p className="flex items-center gap-2 text-xs md:text-sm font-semibold uppercase tracking-wide text-blue-100 mb-3">
                <Sparkles className="h-4 w-4 md:h-5 md:w-5" /> {t(TODAY_WELLNESS)}
              </p>
              <p className="text-sm md:text-base text-white/95 pl-2 border-l-3 border-white/40 leading-relaxed transition-all duration-500">
                {activeQuote}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-xl"></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
        </div>

        {/* Ad Space - shown only when show_ads is true in app_config (after AdSense verification) */}
        {showAds && (
        <div className="rounded-xl border border-border/40 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 p-2.5 md:p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Health & Wellness
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground/60 px-1.5 py-0.5 rounded bg-muted/50 font-medium">Ad</span>
          </div>
          <div className="w-full min-h-[50px] max-h-[120px] overflow-hidden">
            <AdSense
              publisherId={import.meta.env.VITE_ADSENSE_PUBLISHER_ID}
              adSlot={import.meta.env.VITE_ADSENSE_AD_SLOT}
              format="auto"
              minHeight={50}
              showPlaceholder={true}
              className="w-full rounded-lg"
            />
          </div>
        </div>
        )}

        {loading ? (
          <Preloader />
        ) : (
          <>
        {/* Quick Stats - Enhanced Modern Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 p-4 md:p-5 shadow-md border border-blue-200/60 dark:border-blue-800/60 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <FileText className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-blue-700 dark:text-blue-300">{reports.length}</p>
                <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">{t("Total Reports")}</p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/50 dark:to-pink-900/50 p-4 md:p-5 shadow-md border border-rose-200/60 dark:border-rose-800/60 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md">
                <Heart className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="space-y-1">
                <div>
                  <p className="text-[10px] md:text-xs text-rose-600 dark:text-rose-400 font-semibold">{t("BP")}</p>
                  <p className="text-base md:text-lg font-bold text-rose-700 dark:text-rose-300 leading-tight">{bloodPressure ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-rose-600 dark:text-rose-400 font-semibold">{t("Weight")}</p>
                  <p className="text-base md:text-lg font-bold text-rose-700 dark:text-rose-300 leading-tight">{weight != null ? `${weight} kg` : "—"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/50 dark:to-purple-900/50 p-4 md:p-5 shadow-md border border-violet-200/60 dark:border-violet-800/60 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md">
                <Users className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-violet-700 dark:text-violet-300">{familyCount}</p>
                <p className="text-xs md:text-sm text-violet-600 dark:text-violet-400 font-semibold mt-1">{t("Family Members")}</p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/50 dark:to-orange-900/50 p-4 md:p-5 shadow-md border border-amber-200/60 dark:border-amber-800/60 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-amber-700 dark:text-amber-300 leading-tight">{lastCheckup}</p>
                <p className="text-xs md:text-sm text-amber-600 dark:text-amber-400 font-semibold mt-1">{t("Last Checkup")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports - Enhanced Modern Design */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-5 shadow-md">
          <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            {t("Recent Reports")}
          </h2>
          <div className="space-y-3">
            {recentReports.length > 0 ? recentReports.map((r) => (
              <Link key={r.id} to={`/patient/report/${r.id}`} className="group flex items-center justify-between rounded-xl border border-border/60 bg-gradient-to-r from-card to-muted/40 p-4 transition-all hover:shadow-lg hover:border-primary/60 hover:scale-[1.01]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md group-hover:shadow-lg transition-shadow">
                    <FileText className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base md:text-lg text-foreground truncate">{r.test_name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">{r.labs?.name ?? "—"}</p>
                  </div>
                </div>
                <span className="text-xs md:text-sm text-muted-foreground shrink-0 ml-3 font-medium">{formatDate(r.uploaded_at)}</span>
              </Link>
            )) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm md:text-base font-medium">No reports yet</p>
              </div>
            )}
          </div>
          <Link to="/patient/reports" className="mt-5 inline-flex items-center gap-2 text-sm md:text-base font-bold text-primary hover:text-primary/80 hover:underline transition-colors">
            {t("View all reports")} <span className="text-lg">→</span>
          </Link>
        </div>

        {/* Medication Reminders Section */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground md:text-xl">
              <Pill className="h-5 w-5 text-primary md:h-6 md:w-6" />
              {t("Medication Reminders")}
            </h2>
            <Link to="/patient/reminders">
              <Button variant="outline" size="sm" className="rounded-lg border-primary/30 bg-primary/10 text-primary hover:bg-primary/20">
                {t("Manage")}
              </Button>
            </Link>
          </div>
          {reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders.slice(0, 3).map((reminder) => {
                const times: string[] = reminder.times || [];
                const nextTime = times.length > 0 ? times[0] : null;
                return (
                  <div
                    key={reminder.id}
                    className="rounded-xl border border-border/60 bg-gradient-to-br from-purple-50 to-pink-50 p-3 shadow-sm transition-shadow hover:shadow-md dark:from-purple-950/30 dark:to-pink-950/30 md:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md md:h-12 md:w-12">
                        <Bell className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-base font-bold text-foreground md:text-lg">{reminder.medication_name}</p>
                          <span className="rounded-md bg-white/80 px-2 py-1 text-[10px] font-semibold text-purple-700 dark:bg-black/20 dark:text-purple-300">
                            {reminder.is_active === false ? t("Paused") : t("Active")}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                          {reminder.dosage} | {reminder.frequency}
                        </p>
                        {nextTime && (
                          <div className="mt-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            {t("Next dose")}: {nextTime}
                          </div>
                        )}
                        {reminder.notes && <p className="mt-2 text-xs italic text-muted-foreground">{reminder.notes}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {reminders.length > 3 && (
                <Link to="/patient/reminders" className="block pt-2 text-center text-sm font-medium text-primary hover:underline">
                  {t("View all")} {reminders.length - 3} {t("more reminders")}
                </Link>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Pill className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p className="mb-2 text-sm font-medium md:text-base">{t("No active reminders")}</p>
              <p className="mb-4 text-xs text-muted-foreground">{t("Upload a prescription to create medication reminders")}</p>
              <Link to="/patient/upload">
                <Button variant="link" className="h-auto p-0 text-sm font-semibold">{t("Upload Prescription")}</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Lab offers & promotions - Hidden until labs are added */}
        {SHOW_LAB_OFFERS && (
          <div className="rounded-xl border border-border bg-card p-3 md:p-4 shadow-sm">
            <h2 className="font-display text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              {t("Lab offers")}
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Tag className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t("Full body checkup at 20% off")}</p>
                  <p className="text-xs text-muted-foreground">{t("Partner labs – valid this month")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-blue-200/60 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
                  <Stethoscope className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t("Book your next test")}</p>
                  <p className="text-xs text-muted-foreground">{t("Quick results on CliniLocker")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Featured / Ad space - Hidden until needed */}
        {SHOW_FEATURED_ADS && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <h2 className="font-display text-base md:text-lg font-semibold text-foreground">{t("Featured")}</h2>
            </div>
            <div className="rounded-lg border border-border bg-card/50 flex flex-col items-center justify-center py-6 px-4 text-center min-h-[100px]">
              <p className="text-xs md:text-sm text-muted-foreground font-medium">{t("Promotions and health tips from labs appear here")}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground/80 mt-1">{t("Stay tuned for offers")}</p>
            </div>
          </div>
        )}

        {/* Schedule checkup reminder - Hidden until labs are added */}
        {SHOW_SCHEDULE_CHECKUP && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-3 md:p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t("Schedule your next checkup")}</p>
                <p className="text-xs text-muted-foreground">{t("Regular tests help you stay on top of your health.")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Health inspiration – Enhanced Modern Card */}
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 md:p-5 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <h2 className="font-display text-lg md:text-xl font-bold text-foreground">{t("Health inspiration")}</h2>
          </div>
          <div className="flex gap-3 rounded-xl bg-white/70 dark:bg-black/30 p-4 border border-amber-200/60 dark:border-amber-800/60 shadow-sm">
            <Shield className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-sm md:text-base text-foreground font-semibold leading-relaxed">
              {t(REAL_HEALTH_TIPS[healthTipIndex])}
            </p>
          </div>
        </div>
          </>
        )}
      </div>
    </PatientLayout>
  );
};

export default PatientDashboard;

