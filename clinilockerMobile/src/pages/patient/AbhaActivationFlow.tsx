import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Fingerprint, CheckCircle2, Sparkles } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { useAbhaStore } from "@/lib/abhaStore";
import { toast } from "sonner";

const STEP_LABELS = ["Choose", "Verify", "OTP", "Success"];

export default function AbhaActivationFlow() {
  const navigate = useNavigate();
  const { linkAbha } = useAbhaStore();
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<"existing" | "new" | null>(null);
  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(45);

  useEffect(() => {
    if (step !== 3 || timer <= 0) return;
    const t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, timer]);

  const handleContinue = () => {
    if (step === 1 && !choice) {
      toast.error("Please choose an option");
      return;
    }
    if (step === 2) {
      const hasInput = choice === "existing" ? mobile.length >= 10 : aadhaar.length >= 12;
      if (!hasInput) {
        toast.error("Enter a valid Aadhaar or mobile number");
        return;
      }
    }
    if (step === 3 && otp.length !== 6) {
      toast.error("Enter the 6 digit OTP");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleFinish = () => {
    linkAbha({
      name: "Akshay",
      abhaAddress: "akshay@abdm",
      abhaNumber: "1234-5678-9012",
      qrValue: "https://abha.gov.in/mock/akshay",
    });
    toast.success("ABHA linked successfully");
    navigate("/patient/abha/timeline", { replace: true });
  };

  return (
    <PatientLayout>
      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="rounded-2xl border border-blue-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0055BB]">ABHA Activation</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Connect your National Health ID</h1>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            {STEP_LABELS.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`h-6 w-6 rounded-full text-center text-[11px] font-semibold ${
                    step >= idx + 1 ? "bg-[#0055BB] text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className={step === idx + 1 ? "text-foreground font-semibold" : "text-muted-foreground"}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setChoice("existing")}
              className={`rounded-2xl border p-5 text-left transition-all ${
                choice === "existing" ? "border-[#0055BB] bg-blue-50" : "border-border"
              }`}
            >
              <Shield className="h-7 w-7 text-[#0055BB]" />
              <h3 className="mt-4 text-lg font-semibold">I have an ABHA</h3>
              <p className="mt-1 text-sm text-muted-foreground">Link your existing ABHA with mobile OTP.</p>
            </button>
            <button
              type="button"
              onClick={() => setChoice("new")}
              className={`rounded-2xl border p-5 text-left transition-all ${
                choice === "new" ? "border-[#0055BB] bg-blue-50" : "border-border"
              }`}
            >
              <Fingerprint className="h-7 w-7 text-[#0055BB]" />
              <h3 className="mt-4 text-lg font-semibold">Create New with Aadhaar</h3>
              <p className="mt-1 text-sm text-muted-foreground">Generate a new ABHA in minutes.</p>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold">Verify your identity</h3>
            {choice === "existing" ? (
              <input
                className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                placeholder="Registered mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            ) : (
              <input
                className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                placeholder="Aadhaar number"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">We will send an OTP to verify.</p>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold">Enter OTP</h3>
            <input
              className="w-full rounded-xl border border-border px-4 py-3 text-center text-lg tracking-[0.5em]"
              placeholder="______"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            <p className="text-xs text-muted-foreground">Resend available in {timer}s</p>
            <Button
              variant="outline"
              size="sm"
              disabled={timer > 0}
              onClick={() => setTimer(45)}
            >
              Resend OTP
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <CheckCircle2 className="h-8 w-8 text-[#0055BB]" />
            </div>
            <h3 className="text-xl font-semibold">ABHA Linked Successfully</h3>
            <p className="text-sm text-muted-foreground">Your digital health ID is ready.</p>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-[#0055BB]">CLINILOCKER • ABHA CARD</p>
              <p className="mt-2 text-lg font-bold">XXXX-XXXX-9012</p>
              <p className="text-xs text-muted-foreground">akshay@abdm</p>
            </div>
            <Button className="w-full bg-[#0055BB] hover:bg-[#0047a0]" onClick={handleFinish}>
              Save to Gallery
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
              <Sparkles className="h-4 w-4" /> National ID Activated
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              Back
            </Button>
            <Button className="bg-[#0055BB] hover:bg-[#0047a0]" onClick={handleContinue}>
              {step === 3 ? "Verify" : "Continue"}
            </Button>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
