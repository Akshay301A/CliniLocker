import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/lab/dashboard", { replace: true });
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/lab/dashboard` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
      return;
    }
    setGoogleLoading(false);
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
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Lab Login</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Sign in to your lab dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="min-h-[44px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lab@example.com" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="min-h-[44px]" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
              <span className="bg-card px-2">Or continue with</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full min-h-[44px]" onClick={handleGoogleLogin} disabled={googleLoading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Redirecting…" : "Google"}
          </Button>
          <p className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Create account</Link>
          </p>
          <Button variant="outline" className="mt-3 w-full min-h-[44px]" asChild>
            <Link to="/signup">Create lab account</Link>
          </Button>
          <div className="mt-4 pt-4 border-t border-border text-center space-y-1">
            <p className="text-xs text-muted-foreground">Patient?</p>
            <Link to="/patient-login" className="text-sm font-medium text-primary hover:underline inline-block">
              Log in or create account →
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default LoginPage;
