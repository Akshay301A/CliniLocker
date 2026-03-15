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
  ExternalLink,
  Mail,
  MessageCircle,
  Smartphone,
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
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

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
  const [familyMembers, setFamilyMembers] = useState<Awaited<ReturnType<typeof getFamilyMembers>>>([]);
  const { analysis, loading: analysisLoading, error: analysisError } = useReportAnalysis(pdfUrl);
  const [activeChartTab, setActiveChartTab] = useState<"status" | "observations" | "advice">("status");
  const [detail, setDetail] = useState<{ title: string; body: string } | null>(null);
  const touchStartX = useRef(0);

  const derivedFindings = useMemo(() => {
    if (!analysis) return [];
    const cleaned = derivedFindings.filter((f) => f.text.trim().length > 0);
    if (cleaned.length > 0) return cleaned;

    const summary = analysis.summary?.trim() || "";
    const sentences = summary
      .split(/[\.\!\?]\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    const attentionKeywords = ["high", "low", "elevated", "abnormal", "critical", "outside", "positive", "detected", "deficient", "insufficient", "risk", "needs attention", "borderline"];
    const normalKeywords = ["normal", "within", "stable", "healthy", "no evidence", "negative", "acceptable"];

    return sentences.map((text) => {
      const lower = text.toLowerCase();
      const isAttention = attentionKeywords.some((k) => lower.includes(k));
      const isNormal = normalKeywords.some((k) => lower.includes(k));
      return {
        text,
        type: (isAttention && !isNormal ? "attention" : "normal") as "normal" | "attention",
      };
    });
  }, [analysis]);

  const derivedActions = useMemo(() => {
    if (!analysis) return [];
    const cleaned = derivedActions.filter((a) => a.trim().length > 0);
    if (cleaned.length > 0) return cleaned;

    const summary = analysis.summary?.trim() || "";
    const sentences = summary
      .split(/[\.\!\?]\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const actionKeywords = ["recommend", "advise", "consult", "follow", "monitor", "repeat", "review", "consider"];
    return sentences.filter((s) => actionKeywords.some((k) => s.toLowerCase().includes(k))).slice(0, 4);
  }, [analysis]);

  const statusData = useMemo(() => {
    if (!analysis) return [];
    const attentionCount = derivedFindings.filter((f) => f.type === "attention").length;
    const normalCount = derivedFindings.length - attentionCount;
    return [
      { name: t("Normal"), value: normalCount, key: "normal", color: "#22c55e" },
      { name: t("Needs Attention"), value: attentionCount, key: "attention", color: "#f97316" },
    ].filter((d) => d.value > 0);
  }, [analysis, derivedFindings, t]);

  const observationData = useMemo(() => {
    if (!analysis) return [];
    return derivedFindings.map((f, idx) => ({
      name: `${t("Obs")} ${idx + 1}`,
      value: 1,
      type: f.type,
      text: f.text,
      color: f.type === "attention" ? "#f97316" : "#22c55e",
    }));
  }, [analysis, derivedFindings, t]);

  const adviceData = useMemo(() => {
    if (!analysis) return [];
    return derivedActions.map((text, idx) => ({
      name: `${t("Tip")} ${idx + 1}`,
      value: 1,
      text,
      color: "#3b82f6",
    }));
  }, [analysis, derivedActions, t]);

  const chartTabs = useMemo(() => {
    const tabs: { id: "status" | "observations" | "advice"; label: string }[] = [];
    if (statusData.length > 0) tabs.push({ id: "status", label: t("Status") });
    if (observationData.length > 0) tabs.push({ id: "observations", label: t("Observations") });
    if (adviceData.length > 0) tabs.push({ id: "advice", label: t("Advice") });
    return tabs;
  }, [statusData.length, observationData.length, adviceData.length, t]);

  useEffect(() => {
    if (chartTabs.length > 0) {
      setActiveChartTab(chartTabs[0].id);
      setDetail(null);
    }
  }, [chartTabs]);

  const normalFindings = derivedFindings.filter((f) => f.type === "normal").map((f) => f.text);
  const attentionFindings = derivedFindings.filter((f) => f.type === "attention").map((f) => f.text);
  const healthScore = useMemo(() => {
    const total = derivedFindings.length;
    if (total === 0) return 100;
    const attentionCount = derivedFindings.filter((f) => f.type === "attention").length;
    const score = Math.round(((total - attentionCount) / total) * 100);
    return Math.max(0, Math.min(100, score));
  }, [derivedFindings]);

  const defaultDetail = useMemo(() => {
    if (!analysis) return null;
    if (activeChartTab === "status") {
      return {
        title: t("Overall Status"),
        body: attentionFindings.length > 0
          ? `${t("Needs attention:")} ${attentionFindings.join(" • ")}`
          : t("No concerning values detected in the extracted report."),
      };
    }
    if (activeChartTab === "observations") {
      return {
        title: t("Observation details"),
        body: derivedFindings.length > 0
          ? derivedFindings.map((f) => f.text).join(" • ")
          : t("No observations extracted from this report."),
      };
    }
    return {
      title: t("Advice"),
      body: derivedActions.length > 0
        ? derivedActions.join(" • ")
        : t("No advice suggestions were generated for this report."),
    };
  }, [activeChartTab, attentionFindings, derivedActions, derivedFindings, t]);

  const activeDetail = detail ?? defaultDetail;

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

  /** Opens the actual PDF file in a new tab (for mobile "Open PDF" button). */
  const handleOpenPdfInNewTab = () => {
    if (!pdfUrl) {
      toast.error(t("Report file not available."));
      return;
    }
    window.open(pdfUrl, "_blank");
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
      window.open(pdfUrl, "_blank");
      toast.info(t("Opening report in a new tab. Use the browser save option to download."));
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
                          <p className="mt-1 text-sm text-muted-foreground">{t("Open the report in a new tab to view or download.")}</p>
                          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                            <Button className="gap-2 min-h-[44px]" onClick={handleOpenPdfInNewTab}>
                              <ExternalLink className="h-4 w-4" /> {t("Open PDF")}
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
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground">{t("AI Report Summary")}</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{t("AI Generated")}</span>
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
                  </div>

                  {chartTabs.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {chartTabs.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveChartTab(tab.id);
                              setDetail(null);
                            }}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              activeChartTab === tab.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <div
                        className="rounded-xl border border-border bg-background p-4"
                        onTouchStart={(e) => {
                          touchStartX.current = e.touches[0]?.clientX ?? 0;
                        }}
                        onTouchEnd={(e) => {
                          const endX = e.changedTouches[0]?.clientX ?? 0;
                          const delta = endX - touchStartX.current;
                          if (Math.abs(delta) < 40 || chartTabs.length < 2) return;
                          const currentIndex = chartTabs.findIndex((tab) => tab.id === activeChartTab);
                          const nextIndex = delta < 0 ? currentIndex + 1 : currentIndex - 1;
                          if (nextIndex >= 0 && nextIndex < chartTabs.length) {
                            setActiveChartTab(chartTabs[nextIndex].id);
                            setDetail(null);
                          }
                        }}
                      >
                        {activeChartTab === "status" && (
                          <div className="h-48 sm:h-56">
                            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 shadow-sm">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Health Score")}</p>
                                <p className="text-lg font-semibold text-foreground">{healthScore}%</p>
                                <p className="text-xs text-muted-foreground">{t("Based on current report findings")}</p>
                              </div>
                              <div
                                className="relative h-14 w-14 rounded-full"
                                style={{
                                  background: `conic-gradient(#22c55e ${healthScore * 3.6}deg, #f97316 ${healthScore * 3.6}deg 360deg)`,
                                  boxShadow: "0 10px 24px rgba(34,197,94,0.18), 0 4px 10px rgba(249,115,22,0.12)",
                                }}
                              >
                                <div
                                  className="absolute inset-1 rounded-full"
                                  style={{
                                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                                  {healthScore}
                                </div>
                              </div>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={statusData}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={40}
                                  outerRadius={72}
                                  paddingAngle={4}
                                  onClick={(entry) => {
                                    if (!entry?.payload) return;
                                    const key = entry.payload.key as "normal" | "attention";
                                    if (key === "attention") {
                                      setDetail({
                                        title: t("Needs Attention"),
                                        body: attentionFindings.length > 0
                                          ? attentionFindings.join(" • ")
                                          : t("No concerning values detected."),
                                      });
                                    } else {
                                      setDetail({
                                        title: t("Normal"),
                                        body: normalFindings.length > 0
                                          ? normalFindings.join(" • ")
                                          : t("No normal findings were extracted."),
                                      });
                                    }
                                  }}
                                >
                                  {statusData.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                              {statusData.map((entry) => (
                                <div
                                  key={entry.key}
                                  className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
                                >
                                  <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                  <span>{entry.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {activeChartTab === "observations" && (
                          <div className="h-48 sm:h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={observationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis hide />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  onClick={(data) => {
                                    if (data?.payload?.text) {
                                      setDetail({ title: t("Observation detail"), body: data.payload.text });
                                    }
                                  }}
                                  radius={[6, 6, 0, 0]}
                                >
                                  {observationData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        {activeChartTab === "advice" && (
                          <div className="h-48 sm:h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={adviceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis hide />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  fill="#3b82f6"
                                  onClick={(data) => {
                                    if (data?.payload?.text) {
                                      setDetail({ title: t("Advice detail"), body: data.payload.text });
                                    }
                                  }}
                                  radius={[6, 6, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        <p className="mt-3 text-xs text-muted-foreground">
                          {t("Tap a section to see the explanation. Swipe left or right to switch charts.")}
                        </p>
                      </div>

                      {activeDetail && (
                        <div className="rounded-lg border border-border bg-muted/40 p-4">
                          <p className="text-sm font-semibold text-foreground">{activeDetail.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{activeDetail.body}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      {t("No structured chart data could be extracted from this report.")}
                    </div>
                  )}
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
    </>
  );
};

export default ReportViewer;
