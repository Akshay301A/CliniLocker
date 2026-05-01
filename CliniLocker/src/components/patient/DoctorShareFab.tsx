import { useEffect, useRef, useState } from "react";
import { ExternalLink, Flashlight, FlashlightOff, Loader2, QrCode, Send, UserRoundSearch, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

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
  const [startingCamera, setStartingCamera] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannedTarget, setScannedTarget] = useState<ScannedTarget | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef(0);

  const cameraSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const doctorUuid = scannedTarget?.kind === "doctor" ? scannedTarget.doctorId : null;
  const showDoctorFlow = scannedTarget?.kind === "doctor";
  const showPatientFlow = scannedTarget?.kind === "patient";

  const stopCamera = () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setTorchSupported(false);
    setTorchEnabled(false);
    setStartingCamera(false);
  };

  const resetShareFlow = () => {
    setOpen(false);
    setScanning(false);
    setDoctorProfile(null);
    setPatientBundle(null);
    setPatientReportUrls({});
    setShowPatientReports(false);
    setScanError(null);
    setPermissionDialogOpen(false);
    setScannedTarget(null);
    stopCamera();
  };

  const handleOpen = () => {
    setDoctorProfile(null);
    setPatientBundle(null);
    setPatientReportUrls({});
    setShowPatientReports(false);
    setScanError(null);
    setPermissionDialogOpen(false);
    setScannedTarget(null);
    setOpen(true);
    if (cameraSupported) {
      setStartingCamera(true);
      setScanning(true);
    } else {
      setScanning(false);
      setStartingCamera(false);
      setScanError("Camera access is not available on this device or browser.");
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
          setStartingCamera(cameraSupported);
          return;
        }
        setPatientBundle(bundle);
      })
      .finally(() => setBundleLoading(false));
  }, [cameraSupported, scannedTarget, showPatientFlow]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!scanning || !cameraSupported || !videoRef.current) return;

    let cancelled = false;

    const finishScan = (rawValue?: string | null) => {
      const target = parseScannedQr(rawValue);
      if (!target) return false;
      setScannedTarget(target);
      setScanning(false);
      stopCamera();
      return true;
    };

    const scanFrame = async (
      video: HTMLVideoElement,
      context: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      detector: BarcodeDetectorLike | null,
      jsQr: JsQrFn | null
    ) => {
      if (cancelled) return;

      try {
        const now = performance.now();
        if (
          now - lastScanTimeRef.current >= 120 &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          lastScanTimeRef.current = now;

          if (detector) {
            const codes = await detector.detect(video);
            if (finishScan(codes[0]?.rawValue)) return;
          } else if (jsQr && video.videoWidth && video.videoHeight) {
            const maxWidth = 720;
            const scale = Math.min(1, maxWidth / Math.max(video.videoWidth, 1));
            canvas.width = Math.max(1, Math.floor(video.videoWidth * scale));
            canvas.height = Math.max(1, Math.floor(video.videoHeight * scale));
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            if (finishScan(jsQr(image.data, image.width, image.height)?.data)) return;
          }
        }
      } catch {
        // Ignore intermittent frame-level scan failures and keep scanning.
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        void scanFrame(video, context, canvas, detector, jsQr);
      });
    };

    const start = async () => {
      try {
        setScanError(null);
        setPermissionDialogOpen(false);
        setStartingCamera(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = (videoTrack?.getCapabilities?.() as { torch?: boolean } | undefined) ?? undefined;
        setTorchSupported(Boolean(capabilities?.torch));
        setTorchEnabled(false);

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
        video.setAttribute("autoplay", "true");
        video.setAttribute("muted", "true");
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        await video.play();

        setStartingCamera(false);

        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          throw new Error("Unable to start scanner canvas.");
        }

        const hasBarcodeDetector = "BarcodeDetector" in window;
        const detector = hasBarcodeDetector
          ? new (window as typeof window & {
              BarcodeDetector: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
            }).BarcodeDetector({ formats: ["qr_code"] })
          : null;
        const jsQr = hasBarcodeDetector ? null : ((await import("jsqr")).default as JsQrFn);

        void scanFrame(video, context, canvas, detector, jsQr);
      } catch (error) {
        stopCamera();
        setScanning(false);
        const denied =
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "SecurityError");
        setScanError(
          denied
            ? "Camera permission is currently blocked for CliniLocker."
            : "We couldn't start the camera right now."
        );
        setPermissionDialogOpen(true);
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraSupported, scanning]);

  const handleTorchToggle = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as MediaTrackConstraintSet],
      });
      setTorchEnabled((current) => !current);
    } catch {
      toast.error("Flashlight is not available on this device.");
      setTorchSupported(false);
      setTorchEnabled(false);
    }
  };

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
                      {scanning ? (
                        <>
                          <style>{`
                            @keyframes clinilocker-qr-laser {
                              0% { transform: translateY(0); opacity: 0.35; }
                              50% { transform: translateY(210px); opacity: 1; }
                              100% { transform: translateY(0); opacity: 0.35; }
                            }
                          `}</style>
                          <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                          <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-5 rounded-[30px] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.38)]" />
                            <div className="absolute inset-x-10 bottom-10 top-10 overflow-hidden rounded-[24px]">
                              <div
                                className="absolute left-0 right-0 h-0.5 bg-emerald-300/95 shadow-[0_0_20px_rgba(110,231,183,0.95)]"
                                style={{ animation: "clinilocker-qr-laser 2.2s ease-in-out infinite" }}
                              />
                            </div>
                            <div className="absolute inset-x-7 bottom-6 flex items-center justify-between gap-3">
                              <div className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
                                {startingCamera ? "Starting camera..." : "Scanning automatically"}
                              </div>
                              {torchSupported ? (
                                <button
                                  type="button"
                                  onClick={() => void handleTorchToggle()}
                                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/14 text-white backdrop-blur transition hover:bg-white/20"
                                  aria-label={torchEnabled ? "Turn flashlight off" : "Turn flashlight on"}
                                >
                                  {torchEnabled ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                          {scanError ? (
                            <>
                              <p className="text-base font-semibold text-white">{scanError}</p>
                              {cameraSupported ? (
                                <Button
                                  type="button"
                                  className="mt-4 rounded-full bg-white text-slate-900 hover:bg-slate-100"
                                  onClick={() => {
                                    setScanError(null);
                                    setPermissionDialogOpen(false);
                                    setStartingCamera(true);
                                    setScanning(true);
                                  }}
                                >
                                  Try Camera Again
                                </Button>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin text-blue-200" />
                              <p className="mt-3 text-sm text-slate-300">Starting camera...</p>
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

                {doctorProfile ? (
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
                ) : null}

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
                              {report.labs?.name || "CliniLocker"}{" "}
                              {report.uploaded_at
                                ? `• ${new Date(report.uploaded_at).toLocaleDateString("en-IN")}`
                                : ""}
                            </p>
                          </div>
                          <Badge variant={selected ? "default" : "outline"}>
                            {selected ? "Selected" : "Tap to select"}
                          </Badge>
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
                    Loading patient QR...
                  </div>
                ) : patientBundle ? (
                  <>
                    <div className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-lg font-bold text-slate-950">{patientBundle.name || "CliniLocker Patient"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">Health ID: {patientBundle.health_id}</Badge>
                        <Badge variant="outline">Blood Group: {patientBundle.blood_group || "-"}</Badge>
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

                    {showPatientReports ? (
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
                                    {report.labs?.name || "CliniLocker"}{" "}
                                    {report.uploaded_at
                                      ? `• ${new Date(report.uploaded_at).toLocaleDateString("en-IN")}`
                                      : ""}
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
                                    Preparing...
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
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

      <AlertDialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <AlertDialogContent className="rounded-[28px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Allow camera access to scan QR codes</AlertDialogTitle>
            <AlertDialogDescription className="text-left leading-6">
              CliniLocker needs camera access to scan doctor and patient QR codes inside the app. Please allow camera
              permission in your browser or device settings, then return here and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogAction
              onClick={() => {
                setPermissionDialogOpen(false);
                setScanError(null);
                setStartingCamera(true);
                setScanning(true);
              }}
            >
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
