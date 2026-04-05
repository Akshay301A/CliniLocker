import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  FileText,
  Sparkles,
  AlertCircle,
  Info,
  Building2,
  Calendar,
  Loader2,
  Copy,
  Users,
  Mail,
  MessageCircle,
  Smartphone,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  getReportById,
  getReportByIdWithShareToken,
  getSignedUrl,
  getFamilyMembers,
  grantReportAccessToUser,
  analyzeReportFromPdfUrl,
  type ReportAnalysis,
} from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { PatientLayout } from "@/components/PatientLayout";
import { Preloader } from "@/components/Preloader";
import { PdfBottomSheet } from "@/components/PdfBottomSheet";
import { downloadPdfInApp } from "@/lib/nativeDownload";

function formatDate(s: string | undefined) {
  if (!s) return "â€”";
  return new Date(s).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
/** Extract storage path from file_url (path or URL). */
function pathFromFileUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) {
    const match = fileUrl.match(/\/reports\/(.+)$/);
    return match ? match[1] : fileUrl;
  }
  return fileUrl;
}

/** Real AI analysis with OCR fallback for image-based PDFs. */
function useReportAnalysis(pdfUrl: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);

  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    (async () => {
      try {
        const result = await analyzeReportFromPdfUrl(pdfUrl);
        if (cancelled) return;
        if ("error" in result) {
          setError(result.error);
        } else {
          setAnalysis(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to analyze report.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  return { analysis, loading, error };
}

const ReportViewer = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const [report, setReport] = useState<Awaited<ReturnType<typeof getReportById>>>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [pdfSheetOpen, setPdfSheetOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<Awaited<ReturnType<typeof getFamilyMembers>>>([]);
  const { analysis, loading: analysisLoading, error: analysisError } = useReportAnalysis(pdfUrl);
  const attentionFindings = analysis?.findings.filter((f) => f.type === "attention") ?? [];
  const normalFindings = analysis?.findings.filter((f) => f.type === "normal") ?? [];
  const actions = analysis?.actions ?? [];

  useEffect(() => {
    if (!id) return;
    const shareToken = searchParams.get("share");
    let mounted = true;
    const loadReport = async () => {
      let r: Awaited<ReturnType<typeof getReportById>> = null;
      if (shareToken) {
        r = await getReportByIdWithShareToken(id, shareToken);
        if (r && mounted) {
          setSearchParams((prev) => {
            const p = new URLSearchParams(prev);
            p.delete("share");
            return p;
          }, { replace: true });
        }
      } else {
        r = await getReportById(id);
      }
      if (!mounted) return;
      setReport(r);
      if (r?.file_url) {
        const path = pathFromFileUrl(r.file_url);
        if (path) {
          const url = await getSignedUrl(path);
          if (mounted) setPdfUrl(url ?? null);
        }
      }
      setLoading(false);
    };
    loadReport();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    getFamilyMembers().then(setFamilyMembers);
  }, []);

  const getShareableUrl = async (): Promise<string> => {
    if (pdfUrl) return pdfUrl;
    if (report?.file_url) {
      const path = pathFromFileUrl(report.file_url);
      if (path) {
        const url = await getSignedUrl(path);
        if (url) return url;
      }
    }
    throw new Error("Report file not available.");
  };

  const handleCopyLink = async () => {
    try {
      const url = await getShareableUrl();
      await navigator.clipboard.writeText(url);
      toast.success(t("Report PDF link copied."));
    } catch {
      toast.error(t("Report file not available."));
    }
  };


  /** Opens the PDF inside app bottom sheet (mobile). */
  const handleOpenPdfInApp = () => {
    if (!pdfUrl) {
      toast.error(t("Report file not available."));
      return;
    }
    setPdfSheetOpen(true);
  };

  const handleShareWhatsApp = async () => {
    try {
      const url = await getShareableUrl();
      const text = encodeURIComponent(
        t("Health report PDF") + ": " + url
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
      toast.success(t("Opening WhatsApp..."));
    } catch {
      toast.error(t("Report file not available."));
    }
  };

  const handleShareEmail = async () => {
    try {
      const url = await getShareableUrl();
      const subject = encodeURIComponent(
        report?.test_name ? `${t("Health report")}: ${report.test_name}` : t("Health report")
      );
      const body = encodeURIComponent(
        t("Health report PDF link:") + "\n\n" + url
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch {
      toast.error(t("Report file not available."));
    }
  };

  const handleShareSms = async () => {
    try {
      const url = await getShareableUrl();
      const body = encodeURIComponent(
        t("Health report PDF") + ": " + url
      );
      window.location.href = `sms:?body=${body}`;
    } catch {
      toast.error(t("Report file not available."));
    }
  };

  const handleShareWithFamilyMember = async (member: { id: string; name: string; linked_user_id?: string | null }) => {
    if (!id) return;
    if (member.linked_user_id) {
      const result = await grantReportAccessToUser(id, member.linked_user_id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("Report shared with") + ` ${member.name}. ` + t("They can see it under Family Reports."));
    } else {
      try {
        const url = await getShareableUrl();
        await navigator.clipboard.writeText(url);
        toast.success(t("Report PDF link copied. Send it to") + ` ${member.name}.`);
      } catch {
        toast.error(t("Report file not available."));
      }
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!pdfUrl) {
      toast.error(t("Report file not available."));
      return;
    }
    setDownloading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const fileName = `${(report?.test_name ?? "Report").replace(/[<>:"/\\|?*]/g, "_").trim() || "Report"}.pdf`;
        const result = await downloadPdfInApp(pdfUrl, fileName);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(t("Report saved to your device."));
        return;
      }

      const res = await fetch(pdfUrl, { mode: "cors" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(report?.test_name ?? "Report").replace(/[<>:"/\\|?*]/g, "_").trim() || "Report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("Report downloaded."));
    } catch {
      if (Capacitor.isNativePlatform()) {
        toast.error(t("Failed to download report."));
      } else {
        window.open(pdfUrl, "_blank");
        toast.info(t("Opening report in a new tab. Use the browser save option to download."));
      }
    } finally {
      setDownloading(false);
    }
  };

  // Display: browser native PDF engine (iframe). toolbar=0 and navpanes=0 hide Chrome's PDF toolbar/panels; container clips scrollbar.
  const pdfContent = pdfUrl ? (
    <iframe
      src={`${pdfUrl}#toolbar=0&navpanes=0`}
      title={t("Report PDF")}
      style={{ width: "calc(100% + 14px)", height: "100%", border: "none" }}
      className="flex-1 min-h-0 block"
    />
  ) : (
    <div className="flex h-full items-center justify-center text-center text-muted-foreground p-6">
      <div>
        <FileText className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-3 text-sm font-medium">{t("PDF Report")}</p>
        <p className="mt-1 text-xs">{t("Unable to load file or file not yet available.")}</p>
      </div>
    </div>
  );

  if (loading || !report) {
    return (
      <PatientLayout>
        <Preloader />
      </PatientLayout>
    );
  }

  return (
    <>
      <PatientLayout>
        <div className="w-full bg-muted/30">
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Back to Dashboard */}
            <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
              <Link to="/patient/dashboard"><ArrowLeft className="h-4 w-4" /> {t("Back to Dashboard")}</Link>
            </Button>

          {/* Card 1: Report details */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">{report.test_name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {report.labs?.name && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" /> {report.labs.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> {formatDate(report.uploaded_at)}
                    </span>
                    <span>{t("Patient")}: {report.patient_name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" /> {t("Share")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t("Share report")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                      <Copy className="h-4 w-4" /> {t("Copy link")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-muted-foreground font-normal">
                      {t("Share via")}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleShareWhatsApp} className="gap-2 cursor-pointer">
                      <MessageCircle className="h-4 w-4" /> {t("WhatsApp")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareEmail} className="gap-2 cursor-pointer">
                      <Mail className="h-4 w-4" /> {t("Email")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareSms} className="gap-2 cursor-pointer">
                      <Smartphone className="h-4 w-4" /> {t("SMS")}
                    </DropdownMenuItem>
                    {familyMembers.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-muted-foreground font-normal">
                          {t("Share with family member")}
                        </DropdownMenuLabel>
                        {familyMembers.map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            onClick={() => handleShareWithFamilyMember(member)}
                            className="gap-2 cursor-pointer"
                          >
                            <Users className="h-4 w-4" />
                            {member.name} ({member.relation})
                            {!member.linked_user_id && (
                              <span className="ml-1 text-xs text-muted-foreground">({t("invite pending")})</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t("Download")}
                </Button>
              </div>
            </div>
          </div>

          {/* Card 2: Report PDF Viewer - only section where PDF is visible + View Full */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-display text-lg font-semibold text-foreground">{t("Report PDF Viewer")}</h2>
              <Button variant="default" size="sm" className="gap-2" onClick={() => setFullScreen(true)} disabled={!pdfUrl}>
                <Maximize2 className="h-4 w-4" /> {t("View Full")}
              </Button>
            </div>
            <div className="p-4">
              <div className="rounded-lg border border-border bg-white overflow-hidden flex flex-col" style={{ minHeight: "480px" }}>
                <div className="flex-1 min-h-[480px] overflow-hidden flex flex-col">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {pdfUrl ? (
                      <>
                        {/* Mobile: many browsers don't render PDF in iframe — show Open PDF button instead */}
                        <div className="flex h-[480px] flex-col items-center justify-center text-center p-6 md:hidden bg-muted/30">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <FileText className="h-7 w-7 text-primary" />
                          </div>
                          <p className="font-semibold text-foreground">{report?.test_name ?? t("Report PDF")}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{t("Open the report inside the app to view it.")}</p>
                          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                            <Button className="gap-2 min-h-[44px]" onClick={handleOpenPdfInApp}>
                              <FileText className="h-4 w-4" /> {t("Open PDF")}
                            </Button>
                            <Button variant="outline" className="gap-2 min-h-[44px]" onClick={handleDownload} disabled={downloading}>
                              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t("Download PDF")}
                            </Button>
                          </div>
                        </div>
                        {/* Desktop: embedded PDF viewer */}
                        <iframe
                          src={`${pdfUrl}#toolbar=0&navpanes=0`}
                          title={t("Report PDF")}
                          style={{ width: "calc(100% + 14px)", height: "100%", border: "none" }}
                          className="hidden md:block min-h-[480px]"
                        />
                      </>
                    ) : (
                      <div className="flex h-[480px] flex-col items-center justify-center text-center text-muted-foreground p-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                          <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground">{t("Report PDF Viewer")}</p>
                        <p className="mt-1 text-sm">{t("The full report will be displayed here.")}</p>
                        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={handleDownload} disabled={!pdfUrl || downloading}>
                          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t("Download PDF")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: AI Report Summary - below PDF viewer */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground">{t("AI Report Summary")}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/patient/report/${id}/diet`}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  <Utensils className="h-3.5 w-3.5" />
                  {t("Diet Plan")}
                </Link>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{t("AI Generated")}</span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {analysisLoading ? (
                <div className="flex items-center gap-3 text-muted-foreground py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm">{t("Analyzing your report…")}</span>
                </div>
              ) : analysisError ? (
                <div className="flex gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{analysisError}</p>
                </div>
              ) : analysis ? (
                <>
                  <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Patient")}</p>
                      <p className="font-semibold text-foreground">{report?.patient_name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Report")}</p>
                      <p className="font-semibold text-foreground">{report?.test_name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Lab")}</p>
                      <p className="font-semibold text-foreground">{report?.labs?.name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Test Date")}</p>
                      <p className="font-semibold text-foreground">{formatDate(report?.test_date ?? report?.uploaded_at)}</p>
                    </div>
                  </div>                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Summary")}</p>
                      <p className="mt-2 text-sm text-foreground leading-relaxed">{analysis.summary || t("No summary was generated for this report.")}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Needs Attention")}</p>
                        {attentionFindings.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-sm text-foreground list-disc list-inside">
                            {attentionFindings.map((item, idx) => (
                              <li key={idx}>{item.text}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">{t("No critical concerns detected.")}</p>
                        )}
                      </div>
                      <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Normal Findings")}</p>
                        {normalFindings.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-sm text-foreground list-disc list-inside">
                            {normalFindings.map((item, idx) => (
                              <li key={idx}>{item.text}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">{t("No normal findings extracted.")}</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("Recommended Actions")}</p>
                      {actions.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-foreground list-disc list-inside">
                          {actions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">{t("No recommended actions provided.")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-muted/40 border border-border p-4">
                    <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("Disclaimer: This is an AI-generated explanation for informational purposes only. It does not constitute medical advice, diagnosis or treatment. Please consult your doctor for any health concerns.")}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        </div>
      </PatientLayout>

      {/* Full screen PDF overlay */}
      {fullScreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setFullScreen(false)}>
              <Minimize2 className="h-4 w-4" /> {t("Exit full screen")}
            </Button>
            <span className="text-sm font-medium text-muted-foreground truncate max-w-[50%]">{report?.test_name}</span>
            <div className="w-28" aria-hidden />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden bg-white p-0 m-0">
            {pdfContent}
          </div>
        </div>
      )}

      <PdfBottomSheet
        open={pdfSheetOpen}
        onOpenChange={setPdfSheetOpen}
        url={pdfUrl}
        title={report?.test_name ? `${report.test_name} PDF` : t("Report PDF")}
      />
    </>
  );
};

export default ReportViewer;
