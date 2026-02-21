import { useNavigate, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { updateProfile, getPatientPhoneStatus } from "@/lib/api";

function normalizePhone(phone: string): { full: string; display: string } {
  const normalized = phone.replace(/\s/g, "").replace(/^0/, "");
  const full = normalized.startsWith("+") ? normalized : `+91${normalized}`;
  return { full, display: phone.trim() || full };
}

const PatientLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient/dashboard";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { full, display } = normalizePhone(phone);
    if (!full || full.length < 10) {
      toast.error("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    const status = await getPatientPhoneStatus(phone);
    setLoading(false);
    if (mode === "login") {
      if (status === "none") {
        toast.info("No account with this number. Creating new account.");
        setMode("signup");
      } else if (status === "profile_only") {
        toast.info("This number is already linked to an account.");
        return;
      }
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: full,
      options: { channel: "sms" },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOtpSent(true);
    toast.success("OTP sent to " + display);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { full: fullPhone } = normalizePhone(phone);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Sync profile phone so RLS shows reports linked by this phone (e.g. from lab uploads)
    await updateProfile({ phone: fullPhone });
    toast.success("Welcome!");
    navigate(redirectTo, { replace: true });
  };

  return (
    <PublicLayout>
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-elevated sm:p-8">
          <div className="mb-5 sm:mb-6 text-center">
            <img
              src="/logo%20(2).png"
              alt="CliniLocker"
              className="mx-auto mb-3 h-[150px] w-auto object-contain"
            />
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              {mode === "login" ? "Patient Login" : "Create Account"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {mode === "login" ? "Access your health reports securely" : "Sign up with your phone to get started"}
            </p>
          </div>
          {!otpSent ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" className="min-h-[44px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
              </div>
              <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                {loading ? "Sending…" : mode === "login" ? "Send OTP" : "Send OTP to create account"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Enter OTP</Label>
                <Input id="otp" className="min-h-[44px]" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required />
              </div>
              <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                {loading ? "Verifying…" : "Verify & continue"}
              </Button>
              <button type="button" onClick={() => setOtpSent(false)} className="min-h-[44px] w-full flex items-center justify-center text-sm text-muted-foreground hover:text-primary">
                Change phone number
              </button>
            </form>
          )}
          {!otpSent && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "login" ? "New here? " : "Already have an account? "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Create account" : "Log in"}
              </button>
            </p>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};

export default PatientLoginPage;
