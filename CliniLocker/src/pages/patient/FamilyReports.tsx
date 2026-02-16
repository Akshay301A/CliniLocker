import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Eye, Share2 } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { getReportsSharedWithMe } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Preloader } from "@/components/Preloader";
import type { ReportWithLab } from "@/lib/api";

function formatDate(s: string | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

const PatientFamilyReports = () => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<ReportWithLab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getReportsSharedWithMe().then((data) => {
      if (mounted) setReports(data);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("Family Reports")}</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            {t("Reports shared with you by your family members.")}
          </p>
        </div>

        {loading ? (
          <Preloader />
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-hover">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">{r.test_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{r.labs?.name ?? "—"}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(r.uploaded_at)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground truncate">
                    {t("Shared by")}: {r.patient_name ?? "—"}
                  </p>
                  <div className="mt-4">
                    <Button size="sm" variant="outline" className="min-h-[40px]" asChild>
                      <Link to={`/patient/report/${r.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> {t("View")}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {reports.length === 0 && (
              <div className="rounded-xl border border-dashed border-border py-12 text-center">
                <Share2 className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">{t("No reports shared with you yet.")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("When a family member shares a report with you, it will appear here.")}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </PatientLayout>
  );
};

export default PatientFamilyReports;
