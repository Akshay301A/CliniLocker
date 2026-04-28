import { useEffect, useMemo, useRef, useState } from "react";
import { QrCode, ScanLine, Send, UserRoundSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createDoctorShare, getDoctorPublicProfile, getPatientReports, type ReportWithLab } from "@/lib/api";
import { toast } from "sonner";

function extractUuid(value: string): string | null {
  const match = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return match?.[0] ?? null;
}

export function DoctorShareFab() {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<ReportWithLab[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [doctorIdInput, setDoctorIdInput] = useState("");
  const [doctorProfile, setDoctorProfile] = useState<Awaited<ReturnType<typeof getDoctorPublicProfile>>>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const doctorUuid = useMemo(() => extractUuid(doctorIdInput), [doctorIdInput]);
  const scannerSupported =
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!open) return;
    getPatientReports().then((data) => {
      setReports(data);
      setSelectedReportIds(data.slice(0, 2).map((report) => report.id));
    });
  }, [open]);

  useEffect(() => {
    if (!doctorUuid) {
      setDoctorProfile(null);
      return;
    }
    getDoctorPublicProfile(doctorUuid).then(setDoctorProfile);
  }, [doctorUuid]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!scanning || !scannerSupported || !videoRef.current) return;

    let cancelled = false;
    let intervalId: number | null = null;

    const start = async () => {
      try {
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
        const detector = new (window as typeof window & {
          BarcodeDetector: new (options?: { formats?: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> };
        }).BarcodeDetector({ formats: ["qr_code"] });

        intervalId = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            const uuid = value ? extractUuid(value) : null;
            if (uuid) {
              setDoctorIdInput(uuid);
              setScanning(false);
              streamRef.current?.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
          } catch {
            // ignore scan frames that fail
          }
        }, 500);
      } catch {
        setScanning(false);
        toast.error("Unable to access camera scanner");
      }
    };

    start();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [scannerSupported, scanning]);

  const toggleReport = (reportId: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  const handleSend = async () => {
    if (!doctorUuid) {
      toast.error("Scan or enter a doctor UUID first");
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
    setOpen(false);
    setDoctorIdInput("");
    setDoctorProfile(null);
    setSelectedReportIds([]);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_18px_40px_rgba(37,99,235,0.32)] transition hover:scale-105 hover:bg-blue-700"
        aria-label="Scan to Share"
      >
        <QrCode className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Scan to Share</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Doctor QR</p>
                <p className="mt-2 text-sm text-slate-500">
                  Scan the doctor QR or paste the doctor UUID manually.
                </p>

                {scannerSupported && (
                  <div className="mt-4">
                    {!scanning ? (
                      <Button type="button" variant="outline" className="rounded-full" onClick={() => setScanning(true)}>
                        <ScanLine className="mr-2 h-4 w-4" />
                        Start Camera Scan
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" className="rounded-full" onClick={() => setScanning(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Stop Scan
                      </Button>
                    )}
                  </div>
                )}

                {scanning && (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-black">
                    <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
                  </div>
                )}

                <div className="mt-4">
                  <Input
                    value={doctorIdInput}
                    onChange={(event) => setDoctorIdInput(event.target.value)}
                    placeholder="Paste scanned doctor UUID"
                  />
                </div>

                {doctorProfile && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <UserRoundSearch className="h-4 w-4 text-blue-700" />
                      <p className="font-semibold text-slate-900">{doctorProfile.full_name || "Doctor"}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{doctorProfile.medical_council || "Council pending"}</Badge>
                      <Badge variant={doctorProfile.is_verified ? "default" : "secondary"}>
                        {doctorProfile.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Choose reports</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">Select reports to share</h3>
              </div>

              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {reports.map((report) => {
                  const selected = selectedReportIds.includes(report.id);
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => toggleReport(report.id)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
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
                className="h-12 w-full rounded-full bg-blue-600 hover:bg-blue-700"
                onClick={handleSend}
                disabled={loading || selectedReportIds.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Sending..." : "Send to Doctor"}
              </Button>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
