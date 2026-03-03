import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { updateProfile, getPatientPhoneStatus } from "@/lib/api";
import { AppFooter } from "@/components/AppFooter";
import { ArrowLeft, Check, User } from "lucide-react";

const COUNTRY_OPTIONS = [
  { value: "+91", code: "+91", label: "India (+91)", flag: "🇮🇳" },
  { value: "+1-us", code: "+1", label: "United States (+1)", flag: "🇺🇸" },
  { value: "+44", code: "+44", label: "United Kingdom (+44)", flag: "🇬🇧" },
  { value: "+971", code: "+971", label: "UAE (+971)", flag: "🇦🇪" },
  { value: "+61", code: "+61", label: "Australia (+61)", flag: "🇦🇺" },
  { value: "+1-bs", code: "+1", label: "Bahamas (+1)", flag: "🇧🇸" },
];

function normalizePhone(phone: string, countryCode: string): { full: string; display: string } {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  const code = countryCode.replace(/\D/g, "") || "91";
  const full = digits ? `+${code}${digits}` : "";
  return { full, display: phone.trim() || full };
}

const OTP_LENGTH = 6;

const PatientLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient/dashboard";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [countryValue, setCountryValue] = useState("+91");
  const countryCode = COUNTRY_OPTIONS.find((c) => c.value === countryValue)?.code ?? "+91";
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = otpDigits.join("");

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAccepted || !termsAccepted) {
      toast.error("Please accept Privacy Policy and Terms of Use.");
      return;
    }
    const { full, display } = normalizePhone(phone, countryCode);
    if (!full || full.length < 10) {
      toast.error("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    const status = await getPatientPhoneStatus(full);
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
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    toast.success("Code sent to " + display);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { full: fullPhone } = normalizePhone(phone, countryCode);
    if (otp.length !== OTP_LENGTH) {
      toast.error("Please enter the full code.");
      return;
    }
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
    await updateProfile({ phone: fullPhone });
    toast.success("Welcome!");
    navigate(redirectTo, { replace: true });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = [...otpDigits];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      setOtpDigits(next);
      const nextFocus = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const { full, display } = normalizePhone(phone, countryCode);
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
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    toast.success("Code resent to " + display);
  };

  const handleGoogleContinue = async () => {
    setGoogleLoading(true);
    const redirectUrl = redirectTo.startsWith("http")
      ? redirectTo
      : `${window.location.origin}${redirectTo.startsWith("/") ? "" : "/"}${redirectTo}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
      return;
    }
    setGoogleLoading(false);
  };

  const canNext = privacyAccepted && termsAccepted;

  const Header = () => (
    <div className="flex items-center justify-between mb-6">
      <img
        src="/logo%20(2).png"
        alt="CliniLocker"
        className="h-24 sm:h-28 w-auto object-contain shrink-0"
      />
      <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
        <User className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
          <Header />
          {!otpSent ? (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-5 text-center">
                Your Phone Number
              </h1>
              <form onSubmit={sendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Country/Region</Label>
                  <Select value={countryValue} onValueChange={setCountryValue}>
                    <SelectTrigger className="min-h-[48px] rounded-xl border-input bg-muted/50 text-foreground [&>svg]:ml-auto flex items-center gap-2">
                      <span className="text-lg shrink-0" aria-hidden>
                        {COUNTRY_OPTIONS.find((c) => c.value === countryValue)?.flag ?? "🌐"}
                      </span>
                      <SelectValue placeholder="Country/Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Enter Phone Number</Label>
                  <Input
                    type="tel"
                    className="min-h-[48px] rounded-xl border-input bg-muted/50"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    required
                  />
                </div>
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={privacyAccepted}
                      onCheckedChange={(v) => setPrivacyAccepted(!!v)}
                      className="mt-0.5 rounded-md border-2"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">
                      I have read and accept the{" "}
                      <Link to="/privacy" className="text-primary font-medium hover:underline">
                        Privacy Policy
                      </Link>{" "}
                      and agree that my personal data will be processed by you.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={termsAccepted}
                      onCheckedChange={(v) => setTermsAccepted(!!v)}
                      className="mt-0.5 rounded-md border-2"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">
                      I have read and accept the{" "}
                      <Link to="/terms" className="text-primary font-medium hover:underline">
                        Terms of Use
                      </Link>
                      .
                    </span>
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl text-base font-semibold"
                  disabled={loading || !canNext}
                >
                  {loading ? "Sending..." : "Next"}
                </Button>
                <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900">
                  If SMS OTP does not arrive, use Google sign-in below (Twilio trial limits OTP delivery).
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[48px] rounded-xl text-base font-semibold"
                  onClick={handleGoogleContinue}
                  disabled={googleLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {googleLoading ? "Redirecting..." : "Continue with Google"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-10 h-10 rounded-full border border-border bg-muted/50 flex items-center justify-center text-foreground hover:bg-muted"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 relative flex items-center">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[hsl(var(--success))] flex items-center justify-center z-10">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="pl-5 pr-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm shadow-sm">
                    Code is sent. If you still didn&apos;t get the code, please make sure you&apos;ve
                    filled your phone number correctly.
                  </div>
                </div>
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-5 text-center">
                Fill the code
              </h1>
              <form onSubmit={verifyOtp} className="space-y-5">
                <div className="flex justify-center gap-2">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-12 h-12 rounded-xl border-2 border-input bg-muted/50 text-center text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Didn&apos;t get the code?</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl text-base font-semibold"
                  disabled={loading || otp.length !== OTP_LENGTH}
                >
                  {loading ? "Verifying…" : "Verify & continue"}
                </Button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-sm text-muted-foreground hover:text-primary"
                >
                  Change phone number
                </button>
              </form>
            </>
          )}
          {!otpSent && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
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
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default PatientLoginPage;
