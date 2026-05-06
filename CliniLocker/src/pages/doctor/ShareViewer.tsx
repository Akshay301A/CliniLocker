import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, Save } from "lucide-react";
import { DoctorLayout } from "@/components/DoctorLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDoctorShare, getShareReports, getSignedUrl, markDoctorShareRead, updateDoctorShareNotes } from "@/lib/api";
import type { Report, ShareRow } from "@/lib/supabase";

export default function DoctorShareViewer() {
  const { id = "" } = useParams();
  const [share, setShare] = useState<ShareRow | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportUrls, setReportUrls] = useState<Record<string, string>>({});
  const [reportsLoading, setReportsLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [quickNotes, setQuickNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getDoctorShare(id).then((shareRow) => {
      if (!mounted) return;
      setShare(shareRow);
      setQuickNotes(shareRow?.quick_notes ?? "");
    });
    getShareReports(id).then(async (rows) => {
      if (!mounted) return;
      setReports(rows);
      setSelectedReportId(rows[0]?.id ?? null);
      setPreviewError(null);

      if (rows.length === 0) {
        setReportsLoading(false);
        return;
      }

      const resolved = await Promise.all(
        rows.map(async (report) => {
          const signed = await getSignedUrl(report.file_url);
          const fallback = report.file_url?.startsWith("http") ? report.file_url : null;
          return [report.id, signed ?? fallback] as const;
        })
      );

      if (!mounted) return;
      const nextUrls = Object.fromEntries(
        resolved.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
      );
      setReportUrls(nextUrls);
      if (Object.keys(nextUrls).length === 0) {
        setPreviewError("We couldn't open the shared file preview right now.");
      }
      setReportsLoading(false);
    });
    void markDoctorShareRead(id);

    return () => {
      mounted = false;
    };
  }, [id]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId]
  );

  const viewerUrl = selectedReport ? reportUrls[selectedReport.id] || selectedReport.file_url : null;
  const isPdf = viewerUrl?.toLowerCase().includes(".pdf");

  const handleSave = async () => {
    setSaving(true);
    await updateDoctorShareNotes(id, quickNotes);
    setSaving(false);
  };

  return (
    <DoctorLayout>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Shared patient report</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">{share?.patient_name || "Patient share"}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedReportId(report.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedReport?.id === report.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {report.test_name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 min-h-[540px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
            {viewerUrl ? (
              isPdf ? (
                <iframe src={viewerUrl} title={selectedReport?.test_name || "Report"} className="h-[540px] w-full" />
              ) : (
                <img src={viewerUrl} alt={selectedReport?.test_name || "Report"} className="h-[540px] w-full object-contain bg-white" />
              )
            ) : reportsLoading ? (
              <div className="flex h-[540px] items-center justify-center text-slate-500">
                <FileText className="mr-2 h-5 w-5" />
                Loading report preview...
              </div>
            ) : previewError ? (
              <div className="flex h-[540px] items-center justify-center px-6 text-center text-slate-500">
                <div>
                  <FileText className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-3 font-medium text-slate-700">{previewError}</p>
                  <p className="mt-1 text-sm text-slate-500">Please reopen the share after the report access sync finishes.</p>
                </div>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex h-[540px] items-center justify-center px-6 text-center text-slate-500">
                <div>
                  <FileText className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-3 font-medium text-slate-700">No reports were found in this share.</p>
                  <p className="mt-1 text-sm text-slate-500">Ask the patient to reshare the report if this should contain files.</p>
                </div>
              </div>
            ) : (
              <div className="flex h-[540px] items-center justify-center text-slate-500">
                <FileText className="mr-2 h-5 w-5" />
                Loading report preview...
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Quick notes</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Doctor observations</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            These notes stay attached to this share so you can quickly jot down findings before the follow-up.
          </p>
          <Textarea
            value={quickNotes}
            onChange={(event) => setQuickNotes(event.target.value)}
            placeholder="Type quick notes about the report, follow-up suggestions, or red flags to check."
            className="mt-5 min-h-[280px] rounded-[24px] border-slate-200"
          />
          <Button onClick={handleSave} className="mt-4 h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Quick Notes"}
          </Button>
        </section>
      </div>
    </DoctorLayout>
  );
}
