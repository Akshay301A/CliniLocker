import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { startGoogleOAuth } from "@/lib/oauth";
import { useAuth } from "@/contexts/AuthContext";
import { AppFooter } from "@/components/AppFooter";
import { HeartPulse, ShieldCheck, Stethoscope, User } from "lucide-react";

const PatientLoginPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient/dashboard";

  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    const nextFromOAuth = localStorage.getItem("oauth_next_path");
    if (nextFromOAuth) localStorage.removeItem("oauth_next_path");
    if (role === "lab") {
      navigate("/lab/dashboard", { replace: true });
      return;
    }
    const target = nextFromOAuth && nextFromOAuth.startsWith("/") ? nextFromOAuth : "/patient/dashboard";
    navigate(target, { replace: true });
  }, [authLoading, user?.id, role, navigate]);

  const handleGoogleLogin = async () => {
    if (!privacyAccepted || !termsAccepted) {
      toast.error("Please accept Privacy Policy and Terms of Use.");
      return;
    }

    setLoading(true);
    const { error } = await startGoogleOAuth(redirectTo);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-sky-50/40 to-white relative overflow-hidden">
      <div className="absolute -top-20 -left-16 h-52 w-52 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute top-1/2 -right-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute bottom-16 left-10 h-40 w-40 rounded-full bg-rose-300/20 blur-3xl" />

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 backdrop-blur-sm p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between mb-6">
              <img src="/logo%20(2).png" alt="CliniLocker" className="h-20 sm:h-24 w-auto object-contain shrink-0" />
              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-teal-50 p-4 mb-5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Secure patient sign-in
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Access reports, prescriptions, and reminders in one protected health dashboard.
              </p>
            </div>

            <h1 className="text-xl font-semibold text-slate-900 mb-2 text-center">Continue with Google</h1>
            <p className="text-sm text-slate-600 text-center mb-5">
              Fast, secure sign-in with your verified Google account.
            </p>

            <div className="space-y-3 mb-5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={privacyAccepted}
                  onCheckedChange={(v) => setPrivacyAccepted(!!v)}
                  className="mt-0.5 rounded-md border-2"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800">
                  I accept the{" "}
                  <Link to="/privacy" className="text-sky-700 font-medium hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and consent to secure data processing.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(!!v)}
                  className="mt-0.5 rounded-md border-2"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800">
                  I accept the{" "}
                  <Link to="/terms" className="text-sky-700 font-medium hover:underline">
                    Terms of Use
                  </Link>
                  .
                </span>
              </label>
            </div>

            <Button
              type="button"
              className="group relative w-full min-h-[56px] rounded-2xl border-0 bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05] p-[1px] text-foreground shadow-[0_10px_30px_-12px_rgba(66,133,244,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-12px_rgba(234,67,53,0.5)] active:translate-y-0 disabled:opacity-60"
              onClick={handleGoogleLogin}
              disabled={loading || !privacyAccepted || !termsAccepted}
            >
              <span className="flex h-full w-full items-center justify-center rounded-[15px] bg-white/95 px-4 text-slate-900 backdrop-blur-sm">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.7-1.6 2.7-4 2.7-6.9 0-.6-.1-1.3-.2-1.9H12z" />
                    <path fill="#34A853" d="M12 21c2.4 0 4.5-.8 6.1-2.2l-3-2.3c-.8.5-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H3.8V16c1.5 3 4.6 5 8.2 5z" />
                    <path fill="#FBBC05" d="M6.9 13.6c-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6V8H3.8C3.3 9.1 3 10.5 3 12s.3 2.9.8 4l3.1-2.4z" />
                    <path fill="#4285F4" d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.5 3.8 14.4 3 12 3 8.4 3 5.3 5 3.8 8l3.1 2.4C7.6 8.2 9.6 6.6 12 6.6z" />
                  </svg>
                </span>
                <span className="text-[15px] font-semibold tracking-tight">
                  {loading ? "Redirecting..." : "Continue with Google"}
                </span>
              </span>
            </Button>

            <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                Trusted care access
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2">
                <HeartPulse className="h-3.5 w-3.5 text-rose-600" />
                Health data protected
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default PatientLoginPage;
