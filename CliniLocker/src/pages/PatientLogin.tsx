import { useSearchParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { User } from "lucide-react";
import { AppFooter } from "@/components/AppFooter";

const PatientLoginPage = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient/dashboard";

  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleGoogleLogin = async () => {
    if (!privacyAccepted || !termsAccepted) {
      toast.error("Please accept Privacy Policy and Terms of Use.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="flex flex-col min-h-[calc(100vh-10rem)]">
        <section className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
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

              <h1 className="text-xl font-semibold text-foreground mb-2 text-center">Continue with Google</h1>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Sign in to access your reports and health records securely.
              </p>

              <div className="space-y-3 mb-5">
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
                    and agree that my personal data will be processed.
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
                type="button"
                className="group relative w-full min-h-[52px] rounded-full glossy-btn text-primary-foreground font-semibold shadow-[0_12px_32px_-16px_rgba(98,61,217,0.6)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
                onClick={handleGoogleLogin}
                disabled={loading || !privacyAccepted || !termsAccepted}
              >
                <span className="flex h-full w-full items-center justify-center gap-3 rounded-full bg-white/10 px-4 backdrop-blur-sm">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/60">
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
            </div>
          </div>
        </section>
        <AppFooter />
      </div>
    </PublicLayout>
  );
};

export default PatientLoginPage;

