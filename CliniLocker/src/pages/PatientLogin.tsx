import { useSearchParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getPatientEmailStatus, ensureProfileExists } from "@/lib/api";
import { useState } from "react";
import { Eye, EyeOff, User } from "lucide-react";
import { AppFooter } from "@/components/AppFooter";

const PatientLoginPage = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient/dashboard";

  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAccepted || !termsAccepted) {
      toast.error("Please accept Privacy Policy and Terms of Use.");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (authMode === "signup") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      const status = await getPatientEmailStatus(trimmedEmail);
      if (status === "auth") {
        toast.error("Account already exists. Please log in or reset your password.");
        setAuthMode("login");
        return;
      }
      setEmailLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: fullName.trim() || "Patient" },
          emailRedirectTo: `${window.location.origin}/patient/dashboard`,
        },
      });
      if (error) {
        toast.error(error.message);
        setEmailLoading(false);
        return;
      }
      if (data.session?.user) {
        await ensureProfileExists();
        toast.success("Account created! Welcome to CliniLocker.");
        setEmailLoading(false);
        return;
      }
      toast.success("Check your email to confirm your account, then sign in.");
      setEmailLoading(false);
      setAuthMode("login");
      return;
    }

    setEmailLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setEmailLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid")) {
        toast.error("Invalid credentials. If you used Google before, reset your password to set one.");
      } else if (error.message.toLowerCase().includes("confirm")) {
        toast.error("Please confirm your email to continue.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back!");
  };

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Enter your email to reset password.");
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent. Check your email.");
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

              <h1 className="text-xl font-semibold text-foreground mb-2 text-center">Patient Sign In</h1>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Continue with Google or use email & password.
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

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                  <span className="bg-card px-2">Or use email</span>
                </div>
              </div>

              <div className="mb-4 flex gap-2">
                <Button
                  type="button"
                  variant={authMode === "login" ? "default" : "outline"}
                  className="flex-1 rounded-full"
                  onClick={() => setAuthMode("login")}
                >
                  Login
                </Button>
                <Button
                  type="button"
                  variant={authMode === "signup" ? "default" : "outline"}
                  className="flex-1 rounded-full"
                  onClick={() => setAuthMode("signup")}
                >
                  Create account
                </Button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="min-h-[44px]"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="min-h-[44px] pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {authMode === "signup" && (
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="min-h-[44px] pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full min-h-[48px] rounded-full glossy-btn text-primary-foreground font-semibold"
                  disabled={emailLoading}
                >
                  {emailLoading ? "Please wait..." : authMode === "signup" ? "Create Account" : "Sign In"}
                </Button>
              </form>

              <div className="mt-3 text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-primary"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Forgot password? Reset here"}
                </Button>
              </div>
            </div>
          </div>
        </section>
        <AppFooter />
      </div>
    </PublicLayout>
  );
};

export default PatientLoginPage;

