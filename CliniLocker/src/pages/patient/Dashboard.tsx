import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Calendar,
  Clock,
  FileText,
  Heart,
  Shield,
  Sparkles,
  Upload,
  Users,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Preloader } from "@/components/Preloader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getFamilyMembers, getMedicationReminders, getPatientReports, getProfile } from "@/lib/api";
import { fetchHealthQuotes } from "@/lib/healthQuotes";
import { supabase } from "@/lib/supabase";
import type { ReportWithLab } from "@/lib/api";
import { DoctorShareFab } from "@/components/patient/DoctorShareFab";

type ReminderPreview = {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  times?: string[] | null;
};

type DietPlanPreview = {
  reportId: string;
  title: string;
  updatedAt: string | null;
  goal: string | null;
};

const HEALTH_TIPS = [
  "Stay hydrated and keep your latest reports organised in one place.",
  "Regular health checks and medication reminders reduce missed care moments.",
  "Keep family records updated so every consultation is faster and clearer.",
  "Good sleep, simple movement, and consistent tracking build better long-term health.",
];

function displayName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "there";
  return fullName.trim().split(/\s+/)[0] ?? "there";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const PatientDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportWithLab[]>([]);
  const [familyCount, setFamilyCount] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [bloodPressure, setBloodPressure] = useState<string | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [reminders, setReminders] = useState<ReminderPreview[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlanPreview[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([getPatientReports(), getFamilyMembers(), getProfile(), getMedicationReminders({ activeOnly: true })]).then(
      ([reportRows, familyRows, profile, reminderRows]) => {
        if (!mounted) return;
        setReports(reportRows);
        setFamilyCount(familyRows.length);
        setUserName(profile?.full_name ?? null);
        setBloodPressure(profile?.blood_pressure ?? null);
        setWeight(profile?.weight ?? null);
        setReminders((reminderRows || []) as ReminderPreview[]);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchHealthQuotes().then((data) => {
      if (mounted) setQuotes(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDietPlans = async () => {
      if (!reports.length) {
        if (mounted) setDietPlans([]);
        return;
      }

      const reportIds = reports.map((report) => report.id);
      const reportMap = new Map(reports.map((report) => [report.id, report]));
      const { data, error } = await supabase
        .from("report_ai")
        .select("report_id, diet_plan, updated_at")
        .in("report_id", reportIds)
        .not("diet_plan", "is", null);

      if (!mounted || error || !data) {
        if (mounted) setDietPlans([]);
        return;
      }

      const planRows = data as Array<{
        report_id: string;
        updated_at?: string | null;
        diet_plan?: { goal?: string | null } | null;
      }>;

      const items = planRows
        .map((row) => {
          const report = reportMap.get(row.report_id);
          if (!report) return null;
          return {
            reportId: row.report_id,
            title: report.test_name || "Diet plan",
            updatedAt: row.updated_at ?? report.uploaded_at ?? null,
            goal: row.diet_plan?.goal ?? null,
          };
        })
        .filter((item): item is DietPlanPreview => item !== null)
        .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
        .slice(0, 3);

      setDietPlans(items);
    };

    void loadDietPlans();

    return () => {
      mounted = false;
    };
  }, [reports]);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((current) => (current + 1) % HEALTH_TIPS.length);
      setQuoteIndex((current) => (current + 1) % Math.max(quotes.length, 1));
    }, 30000);
    return () => clearInterval(id);
  }, [quotes.length]);

  useEffect(() => {
    if (loading || !user?.id) return;
    const key = `welcome_dashboard_patient_${user.id}`;
    if (sessionStorage.getItem(key) === "1") return;
    toast.success(`Welcome ${displayName(userName ?? user.user_metadata?.full_name)}!`, {
      description: "Your health records are ready.",
    });
    sessionStorage.setItem(key, "1");
  }, [loading, user?.id, user?.user_metadata?.full_name, userName]);

  if (loading) {
    return (
      <PatientLayout>
        <Preloader />
      </PatientLayout>
    );
  }

  const lastReport = reports[0];
  const latestReports = reports.slice(0, 3);
  const latestReminders = reminders.slice(0, 3);
  const quote =
    quotes.length > 0
      ? quotes[quoteIndex % quotes.length]
      : "Everything you need for reports, family records, and care follow-ups is in one place.";

  return (
    <PatientLayout>
      <div className="space-y-4 animate-fade-in md:space-y-6">
        <section className="rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,_#1d4ed8_0%,_#2563eb_52%,_#4f46e5_100%)] p-4 text-white shadow-[0_18px_45px_rgba(37,99,235,0.16)] md:rounded-[28px] md:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-[1.8rem] font-semibold leading-[1.02] tracking-tight md:text-4xl">
                {t("Welcome back")}, {displayName(userName)}.
              </h1>
              <p className="mt-2 max-w-xl text-[15px] leading-6 text-blue-50 md:mt-3 md:text-base md:leading-7">
                {t("Track reports, manage family records, reminders, and diet plans from one clean dashboard.")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:min-w-[360px] sm:gap-3">
              <Link to="/patient/upload" className="min-w-0">
                <Button className="h-10.5 w-full rounded-2xl bg-white px-3 text-[14px] text-blue-700 shadow-sm hover:bg-blue-50">
                  <Upload className="mr-2 h-4 w-4" />
                  {t("Upload report")}
                </Button>
              </Link>
              <Link to="/patient/reports" className="min-w-0">
                <Button variant="outline" className="h-10.5 w-full rounded-2xl border-white/30 bg-white/10 px-3 text-[14px] text-white hover:bg-white/15">
                  <FileText className="mr-2 h-4 w-4" />
                  {t("Browse reports")}
                </Button>
              </Link>
              <Link to={lastReport ? `/patient/report/${lastReport.id}/diet` : "/patient/reports"} className="col-span-2 min-w-0">
                <Button variant="outline" className="h-10.5 w-full rounded-2xl border-white/30 bg-white/10 px-3 text-[14px] text-white hover:bg-white/15">
                  <Utensils className="mr-2 h-4 w-4" />
                  {t("Diet planner")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-3.5 rounded-[22px] border border-white/15 bg-white/10 p-3 backdrop-blur md:mt-6 md:rounded-[24px] md:p-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              {t("Today")}
            </p>
            <p className="mt-1.5 text-[15px] leading-6 text-white/95 md:text-base md:leading-7">{quote}</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5 md:gap-4 xl:grid-cols-4">
          <div className="overflow-hidden rounded-[22px] border border-blue-200/60 bg-gradient-to-br from-blue-50 to-blue-100 p-3.5 shadow-md md:rounded-[24px] md:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md md:h-12 md:w-12">
              <FileText className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <p className="mt-3 text-[1.85rem] font-bold leading-none text-blue-700 md:mt-5 md:text-4xl">{reports.length}</p>
            <p className="mt-2 text-[13px] font-semibold text-blue-600 md:text-sm">{t("Total reports")}</p>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-rose-200/60 bg-gradient-to-br from-rose-50 to-pink-100 p-3.5 shadow-md md:rounded-[24px] md:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md md:h-12 md:w-12">
              <Heart className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <p className="mt-4 text-[2rem] font-bold leading-none text-slate-900 md:mt-5 md:text-4xl">{bloodPressure ?? "—"}</p>
            <p className="mt-2 text-[13px] font-semibold text-rose-600 md:text-sm">{t("Blood pressure")}</p>
            {weight != null && <p className="mt-1.5 text-[11px] font-medium text-rose-500 md:mt-2 md:text-xs">{t("Weight")}: {weight} kg</p>}
          </div>

          <div className="overflow-hidden rounded-[22px] border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-100 p-3.5 shadow-md md:rounded-[24px] md:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md md:h-12 md:w-12">
              <Calendar className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <p className="mt-3 text-lg font-bold leading-tight text-amber-700 md:mt-5 md:text-3xl">{formatDate(lastReport?.uploaded_at)}</p>
            <p className="mt-2 text-[13px] font-semibold text-amber-600 md:text-sm">{t("Last upload")}</p>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-violet-200/60 bg-gradient-to-br from-violet-50 to-purple-100 p-3.5 shadow-md md:rounded-[24px] md:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md md:h-12 md:w-12">
              <Users className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <p className="mt-3 text-[1.85rem] font-bold leading-none text-violet-700 md:mt-5 md:text-4xl">{familyCount}</p>
            <p className="mt-2 text-[13px] font-semibold text-violet-600 md:text-sm">{t("Family linked")}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t("Reports")}</p>
                <h2 className="mt-1 font-display text-[1.4rem] font-semibold text-slate-900 md:text-2xl">{t("Recent reports")}</h2>
              </div>
              <Link to="/patient/reports" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {t("View all")}
              </Link>
            </div>

            <div className="space-y-3">
              {latestReports.length > 0 ? (
                latestReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/patient/report/${report.id}`}
                    className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-3.5 transition hover:bg-white hover:shadow-md md:rounded-[22px] md:p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm md:h-11 md:w-11">
                      <FileText className="h-4.5 w-4.5 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{report.test_name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {(report.labs?.name ?? "CliniLocker")} • {formatDate(report.uploaded_at)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                  {t("Your latest uploaded reports will appear here.")}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm md:h-11 md:w-11">
                  <Bell className="h-4.5 w-4.5 md:h-5 md:w-5" />
                </div>
                <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t("Reminders")}</p>
                <h2 className="mt-1 font-display text-[1.4rem] font-semibold text-slate-900 md:text-2xl">{t("Latest reminders")}</h2>
                </div>
              </div>
              <Link to="/patient/reminders" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {t("Manage")}
              </Link>
            </div>

            <div className="space-y-3">
              {latestReminders.length > 0 ? (
                latestReminders.map((reminder) => (
                  <Link
                    key={reminder.id}
                    to="/patient/reminders"
                    className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-3.5 transition hover:bg-white hover:shadow-md md:rounded-[22px] md:p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm md:h-11 md:w-11">
                      <Bell className="h-4.5 w-4.5 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{reminder.medication_name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {reminder.dosage} • {reminder.frequency}
                      </p>
                      {reminder.times?.[0] && (
                        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          {reminder.times[0]}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                  {t("Create a reminder to keep your medicines on track.")}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm md:h-11 md:w-11">
                  <Utensils className="h-4.5 w-4.5 md:h-5 md:w-5" />
                </div>
                <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t("Diet plans")}</p>
                <h2 className="mt-1 font-display text-[1.4rem] font-semibold text-slate-900 md:text-2xl">{t("Recent diet plans")}</h2>
                </div>
              </div>
              <Link to={lastReport ? `/patient/report/${lastReport.id}/diet` : "/patient/reports"} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {t("Open planner")}
              </Link>
            </div>

            <div className="space-y-3">
              {dietPlans.length > 0 ? (
                dietPlans.map((plan) => (
                  <Link
                    key={plan.reportId}
                    to={`/patient/report/${plan.reportId}/diet`}
                    className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-3.5 transition hover:bg-white hover:shadow-md md:rounded-[22px] md:p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm md:h-11 md:w-11">
                      <Utensils className="h-4.5 w-4.5 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{plan.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {plan.goal ? `${t(plan.goal)} • ` : ""}
                        {formatDate(plan.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                  {t("Generate a diet plan from any report and it will appear here.")}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[28px] md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm md:h-12 md:w-12">
                <Shield className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t("Health inspiration")}</p>
                <h2 className="mt-1 font-display text-[1.4rem] font-semibold text-slate-900 md:text-2xl">{t("Daily motivation")}</h2>
              </div>
            </div>

            <div className="rounded-[20px] bg-slate-50 p-4 md:rounded-[22px] md:p-5">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                <p className="text-[15px] leading-6 text-slate-700 md:text-base md:leading-7">{t(HEALTH_TIPS[tipIndex])}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 md:rounded-[22px] md:p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                {t("Quote")}
              </p>
              <p className="mt-2.5 text-[15px] leading-6 text-slate-600 md:text-base md:leading-7">{quote}</p>
            </div>
          </section>
        </div>
      </div>
      <DoctorShareFab variant="fab" />
    </PatientLayout>
  );
};

export default PatientDashboard;
