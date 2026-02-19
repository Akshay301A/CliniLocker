import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { updateProfile } from "@/lib/api";

const PatientLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient/dashboard";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = phone.replace(/\s/g, "").replace(/^0/, "");
    if (!normalized) {
      toast.error("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized.startsWith("+") ? normalized : `+91${normalized}`,
      options: { channel: "sms" },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOtpSent(true);
    toast.success("OTP sent to " + phone);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = phone.replace(/\s/g, "").replace(/^0/, "");
    const fullPhone = normalized.startsWith("+") ? normalized : `+91${normalized}`;
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    // Use redirect param so invite flow works: after OAuth user returns to e.g. /patient/accept-invite?token=xxx
    const returnPath = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;
    
    // Get redirect URL based on platform
    const { Capacitor } = await import("@capacitor/core");
    const redirectUrl = Capacitor.isNativePlatform() 
      ? `clinilocker://auth/callback?redirect=${encodeURIComponent(returnPath)}`
      : `${window.location.origin}${returnPath}`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: redirectUrl,
        skipBrowserRedirect: Capacitor.isNativePlatform()
      },
    });
    
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
      return;
    }
    
    // In mobile app, open browser for OAuth
    if (Capacitor.isNativePlatform() && data?.url) {
      const { Browser } = await import("@capacitor/browser");
      const { App } = await import("@capacitor/app");
      
      await Browser.open({ url: data.url });
      
      // Listen for OAuth callback
      App.addListener('appUrlOpen', async (event) => {
        const url = new URL(event.url);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!sessionError) {
            await Browser.close();
            const redirectPath = url.searchParams.get('redirect') || '/patient/dashboard';
            navigate(redirectPath, { replace: true });
            toast.success('Signed in successfully!');
          } else {
            toast.error('Failed to sign in');
          }
          App.removeAllListeners();
        }
      });
    }
    
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-md">
          <div className="mb-5 text-center">
            <img
              src="/logo%20(2).png"
              alt="CliniLocker"
              className="mx-auto mb-3 h-20 md:h-24 w-auto object-contain"
            />
            <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">Patient Login</h1>
            <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">Access your health reports securely</p>
          </div>
          {!otpSent ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" className="min-h-[44px] text-sm rounded-lg" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
              </div>
              <Button type="submit" className="w-full min-h-[44px] rounded-lg text-sm" disabled={loading}>
                {loading ? "Sending…" : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Enter OTP</Label>
                <Input id="otp" className="min-h-[44px] text-sm rounded-lg" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required />
              </div>
              <Button type="submit" className="w-full min-h-[44px] rounded-lg text-sm" disabled={loading}>
                {loading ? "Verifying…" : "Verify & Login"}
              </Button>
              <button type="button" onClick={() => setOtpSent(false)} className="min-h-[44px] w-full flex items-center justify-center text-sm text-muted-foreground hover:text-primary">
                Change phone number
              </button>
            </form>
          )}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
              <span className="bg-card px-2">Or continue with</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full min-h-[44px] rounded-lg text-sm" onClick={handleGoogleLogin} disabled={googleLoading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Redirecting…" : "Google"}
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? Use Google or enter your phone above to create one.
          </p>
          <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Lab?</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Log in</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/signup" className="text-sm font-semibold text-primary hover:underline">Create lab account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLoginPage;
