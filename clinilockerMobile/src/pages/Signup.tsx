import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { createLabAndJoin } from "@/lib/api";
import { startGoogleOAuth } from "@/lib/oauth";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Eye, EyeOff, ShieldCheck, TestTube, UserPlus2 } from "lucide-react";

const SignupPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ labName: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    const nextFromOAuth = localStorage.getItem("oauth_next_path");
    if (nextFromOAuth) localStorage.removeItem("oauth_next_path");
    if (role === "lab") {
      const target = nextFromOAuth && nextFromOAuth.startsWith("/") ? nextFromOAuth : "/lab/dashboard";
      navigate(target, { replace: true });
      return;
    }
    navigate("/patient/dashboard", { replace: true });
  }, [authLoading, user?.id, role, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.labName } },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    if (!data.user) {
      setLoading(false);
      return;
    }
    const result = await createLabAndJoin(form.labName.trim(), form.phone.trim());
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Lab account created successfully.");
    navigate("/lab/dashboard", { replace: true });
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    const { error } = await startGoogleOAuth("/lab/complete-signup");
    if (error) {
      toast.error(error);
      setGoogleLoading(false);
      return;
    }
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/35 to-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-20 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute bottom-10 -left-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm">
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <img src="/logo%20(2).png" alt="CliniLocker" className="h-16 w-auto object-contain" />
              <div className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-600" />
              </div>
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">Create Lab Account</h1>
            <p className="mt-1 text-sm text-slate-600">Launch your secure digital lab workspace in CliniLocker.</p>
          </div>

          <div className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Verified and protected onboarding
            </div>
            <p className="mt-1 text-xs text-slate-600">Only authorized lab members can publish and manage reports.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="labName">Lab Name</Label>
              <Input
                id="labName"
                className="min-h-[46px] text-sm rounded-xl mt-1"
                value={form.labName}
                onChange={(e) => setForm({ ...form, labName: e.target.value })}
                placeholder="City Diagnostics"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                className="min-h-[46px] text-sm rounded-xl mt-1"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="min-h-[46px] text-sm rounded-xl mt-1"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="lab@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="min-h-[46px] text-sm rounded-xl mt-1 pr-12"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full min-h-[46px] rounded-xl text-sm font-medium" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wide text-slate-500">
              <span className="bg-white px-2">Or continue with</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full min-h-[46px] rounded-xl text-sm" onClick={handleGoogleSignup} disabled={googleLoading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Redirecting..." : "Google"}
          </Button>

          <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2">
              <TestTube className="h-3.5 w-3.5 text-cyan-600" />
              Report management ready
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2">
              <UserPlus2 className="h-3.5 w-3.5 text-emerald-600" />
              Team onboarding friendly
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have a lab account?{" "}
            <Link to="/login" className="font-semibold text-sky-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
