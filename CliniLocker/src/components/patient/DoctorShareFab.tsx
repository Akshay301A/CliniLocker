import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, QrCode, Send, UserRoundSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  createDoctorShare,
  getDoctorPublicProfile,
  getPatientQrBundle,
  getPatientReports,
  getSignedUrl,
  type PatientQrBundle,
  type ReportWithLab,
} from "@/lib/api";
import { toast } from "sonner";

type JsQrFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number
) => { data?: string | null } | null;

type ScannedTarget =
  | { kind: "doctor"; doctorId: string }
  | { kind: "patient"; healthId: string };

function extractUuid(value: string): string | null {
  const match = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return match?.[0] ?? null;
}

function extractHealthId(value: string): string | null {
  const match = value.match(/(?:\/user\/)?(CL-\d{4}-\d{4})(?:[/?#].*)?$/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function parseScannedQr(value?: string | null): ScannedTarget | null {
  if (!value) return null;
  const healthId = extractHealthId(value);
  if (healthId) return { kind: "patient", healthId };
  const doctorId = extractUuid(value);
  if (doctorId) return { kind: "doctor", doctorId };
  return null;
}

function getReportPath(fileUrl?: string | null): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) {
    const match = fileUrl.match(/\/reports\/(.+)$/);
    return match ? match[1] : "";
  }
  return fileUrl;
}

export function DoctorShareFab() {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<ReportWithLab[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<Awaited<ReturnType<typeof getDoctorPublicProfile>>>(null);
  const [patientBundle, setPatientBundle] = useState<PatientQrBundle | null>(null);
  const [patientReportUrls, setPatientReportUrls] = useState<Record<string, string>>({});
  const [showPatientReports, setShowPatientReports] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedTarget, setScannedTarget] = useState<ScannedTarget | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cameraSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const doctorUuid = scannedTarget?.kind === "doctor" ? scannedTarget.doctorId : null;
  const showDoctorFlow = scannedTarget?.kind === "doctor";
  const showPatientFlow = scannedTarget?.kind === "patient";

  const resetShareFlow = () => {
    setOpen(false);
    setScanning(false);
    setDoctorProfile(null);
    setPatientBundle(null);
    setPatientReportUrls({});
    setShowPatientReports(false);
    setScanError(null);
    setScannedTarget(null);
  };

  const handleOpen = () => {
    setDoctorProfile(null);
    setPatientBundle(null);
    setPatientReportUrls({});
    setShowPatientReports(false);
    setScanError(null);
    setScannedTarget(null);
    setOpen(true);
    if (cameraSupported) {
      setScanning(true);
    } else {
      setScanning(false);
      setScanError("Camera access is not available on this device/browser.");
    }
  };

  useEffect(() => {
    if (!open) return;
    getPatientReports().then((data) => {
      setReports(data);
      setSelectedReportIds(data.slice(0, 2).map((report) => report.id));
    });
  }, [open]);

  useEffect(() => {
    if (!showDoctorFlow || !doctorUuid) {
      setDoctorProfile(null);
      return;
    }
    getDoctorPublicProfile(doctorUuid).then(setDoctorProfile);
  }, [doctorUuid, showDoctorFlow]);

  useEffect(() => {
    if (!showPatientFlow || !scannedTarget) {
      setPatientBundle(null);
      return;
    }
    setBundleLoading(true);
    getPatientQrBundle(scannedTarget.healthId)
      .then((bundle) => {
        if (!bundle) {
          setScanError("Patient QR details could not be loaded.");
          setScannedTarget(null);
          setScanning(cameraSupported);
          return;
        }
        setPatientBundle(bundle);
      })
      .finally(() => setBundleLoading(false));
  }, [cameraSupported, scannedTarget, showPatientFlow]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!scanning || !cameraSupported || !videoRef.current) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const start = async () => {
      try {
        setScanError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current!.srcObject = stream;
        await videoRef.current!.play();

        const hasBarcodeDetector = "BarcodeDetector" in window;
        const detector = hasBarcodeDetector
          ? new (window as typeof window & {
              BarcodeDetector: new (options?: { formats?: string[] }) => {
                detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
              };
            }).BarcodeDetector({ formats: ["qr_code"] })
          : null;
        const jsQr: JsQrFn | null = hasBarcodeDetector
          ? null
          : ((await import("jsqr")).default as JsQrFn);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        const finishScan = (rawValue?: string | null) => {
          const target = parseScannedQr(rawValue);
          if (!target) return false;
          setScannedTarget(target);
          setScanning(false);
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          return true;
        };

        const scanFrame = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            if (videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              if (detector) {
                const codes = await detector.detect(videoRef.current);
                if (finishScan(codes[0]?.rawValue)) return;
              } else if (jsQr && context && videoRef.current.videoWidth && videoRef.current.videoHeight) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const image = context.getImageData(0, 0, canvas.width, canvas.height);
                if (finishScan(jsQr(image.data, image.width, image.height)?.data)) return;
              }
            }
          } catch {
            // Ignore intermittent frame-level scan failures.
          }
          timeoutId = window.setTimeout(scanFrame, 350);
        };

        void scanFrame();
      } catch {
        setScanning(false);
        setScanError("Unable to access the camera. Please allow camera permission and try again.");
        toast.error("Unable to access camera scanner");
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraSupported, scanning]);

  const toggleReport = (reportId: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  const handleSend = async () => {
    if (!doctorUuid) {
      toast.error("Doctor QR was not detected");
      return;
    }
    setLoading(true);
    const result = await createDoctorShare(doctorUuid, selectedReportIds);
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Reports shared with doctor");
    resetShareFlow();
    setSelectedReportIds([]);
  };

  const handleViewPatientReports = async () => {
    if (!patientBundle) return;
    setShowPatientReports(true);
    const missing = patientBundle.reports.filter((report) => !patientReportUrls[report.id]);
    if (missing.length === 0) return;

    const entries = await Promise.all(
      missing.map(async (report) => {
        const signed = await getSignedUrl(getReportPath(report.file_url));
        return [report.id, signed] as const;
      })
    );

    setPatientReportUrls((prev) => {
      const next = { ...prev };
      for (const [reportId, signed] of entries) {
        if (signed) next[reportId] = signed;
      }
      return next;
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_18px_40px_rgba(37,99,235,0.32)] transition hover:scale-105 hover:bg-blue-700"
        aria-label="Scan QR"
      >
        <QrCode className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? resetShareFlow() : setOpen(nextOpen))}>
        <DialogContent className="max-w-[calc(100vw-1rem)] overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">QR Scanner</DialogTitle>
          </DialogHeader>

          <div className="bg-white">
            {!scannedTarget ? (
              <section className="relative bg-slate-950 text-white">
                <button
                  type="button"
                  onClick={resetShareFlow}
                  className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
                  aria-label="Close scanner"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="px-4 pb-6 pt-14 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Scan QR</p>
                  <h2 className="mt-2 text-2xl font-bold">Point your camera at a doctor or patient QR</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Doctor QR opens report sharing. Patient QR opens the patient card and linked reports.
                  </p>

                  <div className="mt-5 overflow-hidden rounded-[28px] border border-white/15 bg-black shadow-[0_24px_70px_rgba(15,23,42,0.45)]">
                    <div className="relative aspect-square w-full">
                      {scanning && (
                        <>
                          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                          <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-5 rounded-[30px] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.38)]" />
                            <div className="absolute left-10 right-10 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-300/90 shadow-[0_0_18px_rgba(110,231,183,0.95)]" />
                          </div>
                        </>
                      )}

                      {!scanning && (
                        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                          {scanError ? (
                            <>
                              <p className="text-base font-semibold text-white">{scanError}</p>
                              {cameraSupported && (
                                <Button
                                  type="button"
                                  className="mt-4 rounded-full bg-white text-slate-900 hover:bg-slate-100"
                                  onClick={() => {
                                    setScanError(null);
                                    setScanning(true);
                                  }}
                                >
                                  Try Camera Again
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin text-blue-200" />
                              <p className="mt-3 text-sm text-slate-300">Starting camera…</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : showDoctorFlow ? (
              <section className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Doctor QR</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">Select reports to share</h2>
                  </div>
                  <button
                    type="button"
                    onClick={resetShareFlow}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500"
                    aria-label="Close share sheet"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {doctorProfile && (
                  <div className="mt-4 rounded-[24px] border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex items-center gap-2">
                      <UserRoundSearch className="h-4 w-4 text-blue-700" />
                      <p className="font-semibold text-slate-900">{doctorProfile.full_name || "Doctor"}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{doctorProfile.medical_council || "Council pending"}</Badge>
                      <Badge variant={doctorProfile.is_verified ? "default" : "secondary"}>
                        {doctorProfile.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="mt-5 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                  {reports.map((report) => {
                    const selected = selectedReportIds.includes(report.id);
                    return (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => toggleReport(report.id)}
                        className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                          selected
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">{report.test_name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {report.labs?.name || "CliniLocker"} • {report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString("en-IN") : ""}
                            </p>
                          </div>
                          <Badge variant={selected ? "default" : "outline"}>{selected ? "Selected" : "Tap to select"}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  className="mt-5 h-12 w-full rounded-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleSend}
                  disabled={loading || selectedReportIds.length === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Sending..." : "Send to Doctor"}
                </Button>
              </section>
            ) : (
              <section className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Patient QR</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">Patient card and linked reports</h2>
                  </div>
                  <button
                    type="button"
                    onClick={resetShareFlow}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500"
                    aria-label="Close patient sheet"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {bundleLoading ? (
                  <div className="mt-6 flex items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-10 text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading patient QR…
                  </div>
                ) : patientBundle ? (
                  <>
                    <div className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-lg font-bold text-slate-950">{patientBundle.name || "CliniLocker Patient"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">Health ID: {patientBundle.health_id}</Badge>
                        <Badge variant="outline">Blood Group: {patientBundle.blood_group || "—"}</Badge>
                        <Badge variant="secondary">{patientBundle.reports.length} reports linked</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 rounded-full border-emerald-200"
                        onClick={() => void handleViewPatientReports()}
                      >
                        View Reports
                      </Button>
                    </div>

                    {showPatientReports && (
                      <div className="mt-5 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                        {patientBundle.reports.length === 0 ? (
                          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            No reports are linked to this patient yet.
                          </div>
                        ) : (
                          patientBundle.reports.map((report) => (
                            <div key={report.id} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900">{report.test_name}</p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {report.labs?.name || "CliniLocker"} • {report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString("en-IN") : ""}
                                  </p>
                                </div>
                                {patientReportUrls[report.id] ? (
                                  <a
                                    href={patientReportUrls[report.id]}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm font-medium text-slate-700"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open
                                  </a>
                                ) : (
                                  <span className="inline-flex h-10 shrink-0 items-center rounded-full border border-slate-200 px-3 text-sm text-slate-400">
                                    Preparing…
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-6 rounded-[24px] border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
                    Patient QR details could not be loaded.
                  </div>
                )}
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
