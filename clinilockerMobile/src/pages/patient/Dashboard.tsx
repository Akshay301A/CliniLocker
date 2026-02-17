import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Upload, Users, Share2, TrendingUp, Calendar, Shield, Sparkles, Heart } from "lucide-react";
import { Preloader } from "@/components/Preloader";
import { PatientLayout } from "@/components/PatientLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPatientReports, getFamilyMembers, getProfile } from "@/lib/api";
import { fetchHealthQuotes } from "@/lib/healthQuotes";
import type { ReportWithLab } from "@/lib/api";

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

const TIP_ROTATE_MS = 30 * 1000;
const TODAY_WELLNESS = "Today";

const PatientDashboard = () => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<ReportWithLab[]>([]);
  const [familyCount, setFamilyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [bloodPressure, setBloodPressure] = useState<string | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [healthQuotes, setHealthQuotes] = useState<string[]>([]);
  const [healthTipIndex, setHealthTipIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPatientReports(), getFamilyMembers(), getProfile()]).then(([r, f, p]) => {
      if (mounted) {
        setReports(r);
        setFamilyCount(f.length);
        setUserName(p?.full_name ?? null);
        setBloodPressure(p?.blood_pressure ?? null);
        setWeight(p?.weight ?? null);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchHealthQuotes().then((quotes) => {
      if (mounted) setHealthQuotes(quotes);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthTipIndex((i) => (i + 1) % REAL_HEALTH_TIPS.length);
    }, TIP_ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  const recentReports = reports.slice(0, 3);
  const lastReport = reports[0];
  const lastCheckup = lastReport?.uploaded_at ? formatDate(lastReport.uploaded_at) : "—";

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-4 sm:space-y-6">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {t("Welcome back")}, {displayName(userName ?? undefined)}! 👋
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">{t("Your health reports are safe and accessible anytime.")}</p>
          {healthQuotes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary mb-2">
                <Sparkles className="h-3.5 w-3.5" /> {t(TODAY_WELLNESS)}
              </p>
              <p className="text-sm text-muted-foreground pl-1 border-l-2 border-primary/30">
                {healthQuotes[0]}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <Preloader />
        ) : (
          <>
        {/* Quick Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">{reports.length}</p>
                <p className="text-xs text-muted-foreground">{t("Total Reports")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <Heart className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t("BP")}</p>
                  <p className="text-base font-bold text-foreground leading-tight">{bloodPressure ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t("Weight")}</p>
                  <p className="text-base font-bold text-foreground leading-tight">{weight != null ? `${weight} kg` : "—"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">{familyCount}</p>
                <p className="text-xs text-muted-foreground">{t("Family Members")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground">{lastCheckup}</p>
                <p className="text-xs text-muted-foreground">{t("Last Checkup")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <h2 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">{t("Recent Reports")}</h2>
          <div className="space-y-3">
            {recentReports.map((r) => (
              <Link key={r.id} to={`/patient/report/${r.id}`} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.test_name}</p>
                    <p className="text-xs text-muted-foreground">{r.labs?.name ?? "—"}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(r.uploaded_at)}</span>
              </Link>
            ))}
          </div>
            <Link to="/patient/reports" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              {t("View all reports")} →
            </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <Link to="/patient/reports" className="group flex min-h-[44px] gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-hover hover:border-primary/30">
            <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground">{t("My Reports")}</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t("View and download all your health reports.")}</p>
            </div>
          </Link>
          <Link to="/patient/upload" className="group flex min-h-[44px] gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-hover hover:border-primary/30">
            <Upload className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground">{t("Upload Report")}</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t("Add reports from other labs or clinics.")}</p>
            </div>
          </Link>
          <Link to="/patient/family-reports" className="group flex min-h-[44px] gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-hover hover:border-primary/30">
            <Share2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground">{t("Family Reports")}</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t("Reports shared with you by family.")}</p>
            </div>
          </Link>
          <Link to="/patient/family" className="group flex min-h-[44px] gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-hover hover:border-primary/30">
            <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground">{t("Family Members")}</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t("Manage health records for your family.")}</p>
            </div>
          </Link>
        </div>

        {/* Health inspiration – real tips, rotate every 30s */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">{t("Health inspiration")}</h2>
          </div>
          <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
            <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
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
