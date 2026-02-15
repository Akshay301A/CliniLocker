import { useState, useEffect } from "react";
import { LabLayout } from "@/components/LabLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLabReports, getSignedUrl } from "@/lib/api";
import type { Report } from "@/lib/supabase";

function formatDate(s: string | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function pathFromFileUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) {
    const match = fileUrl.match(/\/reports\/(.+)$/);
    return match ? match[1] : fileUrl;
  }
  return fileUrl;
}

const LabReports = () => {
  const { labId } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!labId) return;
    let mounted = true;
    getLabReports(labId).then((data) => {
      if (mounted) {
        setReports(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [labId]);

  const handleView = async (r: Report) => {
    const path = pathFromFileUrl(r.file_url);
    if (!path) return;
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async (r: Report) => {
    const path = pathFromFileUrl(r.file_url);
    if (!path) return;
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank");
  };

  if (loading) {
    return (
      <LabLayout>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </LabLayout>
    );
  }

  return (
    <LabLayout>
      <div className="animate-fade-in">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">All uploaded reports and their status.</p>
        <div className="mt-6 hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.id.slice(0, 8)}…</TableCell>
                  <TableCell className="font-medium">{r.patient_name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.test_name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.uploaded_at)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "viewed" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(r)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(r)}><Download className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-6 md:hidden space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</p>
                <Badge variant={r.status === "viewed" ? "default" : "secondary"} className="shrink-0">{r.status}</Badge>
              </div>
              <p className="font-medium text-foreground mt-1">{r.patient_name}</p>
              <p className="text-sm text-muted-foreground">{r.test_name} • {formatDate(r.uploaded_at)}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="min-h-[40px] flex-1" onClick={() => handleView(r)}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> View
                </Button>
                <Button variant="ghost" size="sm" className="min-h-[40px] flex-1" onClick={() => handleDownload(r)}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </div>
          ))}
        </div>
        {reports.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            No reports yet. Upload your first report.
          </div>
        )}
      </div>
    </LabLayout>
  );
};

export default LabReports;
