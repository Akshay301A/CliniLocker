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
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [quickNotes, setQuickNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoctorShare(id).then((shareRow) => {
      setShare(shareRow);
      setQuickNotes(shareRow?.quick_notes ?? "");
    });
    getShareReports(id).then(async (rows) => {
      setReports(rows);
      setSelectedReportId(rows[0]?.id ?? null);
      const resolved = await Promise.all(
        rows.map(async (report) => [report.id, await getSignedUrl(report.file_url)] as const)
      );
      setReportUrls(Object.fromEntries(resolved.filter((entry): entry is readonly [string, string] => !!entry[1])));
    });
    markDoctorShareRead(id);
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
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Shared patient report</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{share?.patient_name || "Patient share"}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedReportId(report.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                selectedReport?.id === report.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {report.test_name}
            </button>
          ))}
        </div>

        <div className="mt-5 min-h-[420px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
          {viewerUrl ? (
            isPdf ? (
              <iframe src={viewerUrl} title={selectedReport?.test_name || "Report"} className="h-[420px] w-full" />
            ) : (
              <img src={viewerUrl} alt={selectedReport?.test_name || "Report"} className="h-[420px] w-full object-contain bg-white" />
            )
          ) : (
            <div className="flex h-[420px] items-center justify-center text-slate-500">
              <FileText className="mr-2 h-5 w-5" />
              Loading report preview...
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Quick notes</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Doctor observations</h2>
        <Textarea
          value={quickNotes}
          onChange={(event) => setQuickNotes(event.target.value)}
          placeholder="Type quick notes for this shared report."
          className="mt-5 min-h-[220px] rounded-[24px] border-slate-200"
        />
        <Button onClick={handleSave} className="mt-4 h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Quick Notes"}
        </Button>
      </div>
    </DoctorLayout>
  );
}
