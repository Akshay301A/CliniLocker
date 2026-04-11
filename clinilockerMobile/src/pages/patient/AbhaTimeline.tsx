import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Shield, Clock, FileText } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { useAbhaStore } from "@/lib/abhaStore";
import { getPatientReports } from "@/lib/api";
import type { ReportWithLab } from "@/lib/api";

type TimelineItem = {
  id: string;
  title: string;
  date: string;
  source: "manual" | "abha";
  summary: string;
  facility?: string;
  fhir?: { testName: string; result: string; range: string; status: string }[];
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

export default function AbhaTimeline() {
  const { medicalRecords, setMedicalRecords, isSyncing, setSyncing } = useAbhaStore();

  useEffect(() => {
    let mounted = true;
    setSyncing(true);
    getPatientReports()
      .then((reports: ReportWithLab[]) => {
        if (!mounted) return;
        const manualItems: TimelineItem[] = reports.map((r) => ({
          id: r.id,
          title: r.test_name,
          date: r.uploaded_at || new Date().toISOString(),
          source: "manual",
          summary: "Self-uploaded report",
          facility: r.labs?.name || "Self upload",
        }));

        const combined = [...medicalRecords, ...manualItems].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMedicalRecords(combined);
      })
      .finally(() => mounted && setSyncing(false));
    return () => {
      mounted = false;
    };
  }, []);

  const timelineItems = useMemo(() => medicalRecords, [medicalRecords]);

  return (
    <PatientLayout>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-blue-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0055BB]">Unified Timeline</p>
          <h1 className="mt-2 text-2xl font-bold">Your ABHA + Manual Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">Verified ABHA data and self uploads in one feed.</p>
        </div>

        {isSyncing && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-sm animate-pulse">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-3/5 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/5 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {!isSyncing && timelineItems.length === 0 && (
          <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <FileText className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No records synced yet.</p>
          </div>
        )}

        <div className="space-y-3">
          {timelineItems.map((record) => (
            <div key={record.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {record.source === "abha" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#0055BB]">
                        <Shield className="h-3.5 w-3.5" /> ABHA Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Self-Uploaded
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{record.title}</h3>
                  <p className="text-xs text-muted-foreground">{record.facility || "Digital Locker"}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {formatDate(record.date)}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{record.summary}</p>
              {record.source === "abha" && record.fhir && (
                <Link
                  to={`/patient/abha/record/${record.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0055BB]"
                >
                  View verified details
                </Link>
              )}
              {record.source === "manual" && (
                <Link
                  to={`/patient/report/${record.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  Open report
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </PatientLayout>
  );
}
