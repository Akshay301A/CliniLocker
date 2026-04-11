import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Download, Smartphone } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PatientProfileGuard } from "@/components/PatientProfileGuard";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Preloader } from "@/components/Preloader";
import { ensureNotificationChannel, setupNotificationHandlers } from "@/lib/notifications";
import { setupPushNotificationTapHandler } from "@/lib/pushRegistration";
import { requestEssentialPermissionsOnce } from "@/lib/nativePermissions";
import { checkForAppUpdate, openAppUpdateUrl, type AppUpdateCheckResult } from "@/lib/appUpdate";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LabCompleteSignup from "./pages/LabCompleteSignup";
import PatientLogin from "./pages/PatientLogin";
import ResetPassword from "./pages/ResetPassword";
import LabDashboard from "./pages/lab/Dashboard";
import LabUpload from "./pages/lab/Upload";
import LabPatients from "./pages/lab/Patients";
import LabReports from "./pages/lab/Reports";
import LabSettings from "./pages/lab/Settings";
import PatientDashboard from "./pages/patient/Dashboard";
import PatientMyReports from "./pages/patient/MyReports";
import PatientUploadReports from "./pages/patient/UploadReports";
import PatientFamilyMembers from "./pages/patient/FamilyMembers";
import PatientFamilyReports from "./pages/patient/FamilyReports";
import AcceptInvite from "./pages/patient/AcceptInvite";
import PatientSettings from "./pages/patient/Settings";
import PatientMyProfile from "./pages/patient/MyProfile";
import PatientHealthCard from "./pages/patient/HealthCard";
import AbhaActivationFlow from "./pages/patient/AbhaActivationFlow";
import AbhaConsentDashboard from "./pages/patient/AbhaConsentDashboard";
import AbhaTimeline from "./pages/patient/AbhaTimeline";
import AbhaRecordViewer from "./pages/patient/AbhaRecordViewer";
import PatientCompleteProfile from "./pages/patient/CompleteProfile";
import PatientReminders from "./pages/patient/Reminders";
import ReportViewer from "./pages/patient/ReportViewer";
import DietPlan from "./pages/patient/DietPlan";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PRELOADER_MIN_MS = 3000;
const UPDATE_DISMISS_KEY = "app_update_dismissed_for_version";

function AppUpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateCheckResult | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let mounted = true;
    checkForAppUpdate()
      .then((result) => {
        if (!mounted || !result) return;
        if (!result.forceUpdate) {
          const dismissedForVersion = localStorage.getItem(UPDATE_DISMISS_KEY);
          if (dismissedForVersion === result.latestVersion) return;
        }
        setUpdateInfo(result);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleLater = () => {
    if (!updateInfo || updateInfo.forceUpdate) return;
    localStorage.setItem(UPDATE_DISMISS_KEY, updateInfo.latestVersion);
    setUpdateInfo(null);
  };

  const handleUpdateNow = async () => {
    if (!updateInfo) return;
    setOpening(true);
    try {
      await openAppUpdateUrl(updateInfo.apkUrl);
    } finally {
      setOpening(false);
    }
  };

  return (
    <Dialog open={!!updateInfo}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl border-0 bg-transparent p-0 shadow-2xl [&>button]:hidden">
        <div className="bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 p-[1px]">
          <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white p-5 sm:p-6">
            <DialogHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 text-sky-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                {updateInfo && (
                  <div className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                    v{updateInfo.latestVersion}
                  </div>
                )}
              </div>
              <DialogTitle className="text-left text-xl font-semibold text-slate-900">
                {updateInfo?.title || "Update Available"}
              </DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed text-slate-600">
                {updateInfo?.message}
              </DialogDescription>
            </DialogHeader>
            {updateInfo && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Installed: <span className="font-medium text-slate-800">v{updateInfo.currentVersion}</span>
                <span className="mx-2 text-slate-300">|</span>
                Latest: <span className="font-medium text-slate-800">v{updateInfo.latestVersion}</span>
              </div>
            )}
            <DialogFooter className="mt-5 gap-2 sm:gap-3">
              {!updateInfo?.forceUpdate && (
                <Button
                  variant="outline"
                  onClick={handleLater}
                  disabled={opening}
                  className="h-11 rounded-xl border-slate-300 px-5 text-slate-700"
                >
                  Later
                </Button>
              )}
              <Button
                onClick={handleUpdateNow}
                disabled={opening}
                className="h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-6 text-white hover:from-cyan-600 hover:to-sky-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {opening ? "Opening..." : "Update Now"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AppRoutes() {
  const { user, role, loading } = useAuth();

  const MobileRootRedirect = () => {
    if (loading) {
      return <Preloader fullScreen showSplashVideo />;
    }
    if (Capacitor.isNativePlatform()) {
      const hasSeenOnboarding = localStorage.getItem("clinilocker_onboarding_seen") === "1";
      if (!user) {
        return hasSeenOnboarding ? <Navigate to="/patient-login" replace /> : <Index />;
      }
      if (role === "lab") return <Navigate to="/lab/dashboard" replace />;
      return <Navigate to="/patient/dashboard" replace />;
    }
    return <Index />;
  };

  // Setup notification handlers when app loads
  useEffect(() => {
    ensureNotificationChannel().catch(() => {});
    requestEssentialPermissionsOnce().catch(() => {});

    const cleanup = setupNotificationHandlers((data) => {
      // When user taps notification, navigate to reminders page
      window.location.href = "/patient/reminders";
    });
    let cleanupPush: (() => void) | null = null;
    setupPushNotificationTapHandler(({ route }) => {
      window.location.href = route || "/patient/reports";
    }).then((fn) => {
      cleanupPush = fn;
    });
    return () => {
      cleanup();
      cleanupPush?.();
    };
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppUpdatePrompt />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<MobileRootRedirect />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/lab/complete-signup" element={<LabCompleteSignup />} />
          <Route path="/patient-login" element={<PatientLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/patient/accept-invite" element={<AcceptInvite />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/lab/dashboard" element={<ProtectedRoute requiredRole="lab"><LabDashboard /></ProtectedRoute>} />
          <Route path="/lab/upload" element={<ProtectedRoute requiredRole="lab"><LabUpload /></ProtectedRoute>} />
          <Route path="/lab/patients" element={<ProtectedRoute requiredRole="lab"><LabPatients /></ProtectedRoute>} />
          <Route path="/lab/reports" element={<ProtectedRoute requiredRole="lab"><LabReports /></ProtectedRoute>} />
          <Route path="/lab/settings" element={<ProtectedRoute requiredRole="lab"><LabSettings /></ProtectedRoute>} />
          <Route path="/patient/complete-profile" element={<ProtectedRoute requiredRole="patient"><PatientCompleteProfile /></ProtectedRoute>} />
          <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientDashboard /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/reports" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientMyReports /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/upload" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientUploadReports /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/family-reports" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientFamilyReports /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/family" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientFamilyMembers /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientMyProfile /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/health-card" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientHealthCard /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/abha/activate" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><AbhaActivationFlow /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/abha/consents" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><AbhaConsentDashboard /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/abha/timeline" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><AbhaTimeline /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/abha/record/:id" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><AbhaRecordViewer /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/settings" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientSettings /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/reminders" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientReminders /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/report/:id" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><ReportViewer /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/report/:id/diet" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><DietPlan /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

/** Shows preloader for at least 3s, then it shrinks and fades out in place at center; app shows immediately after. */
function AppContent() {
  const { loading } = useAuth();
  const [showPreloader, setShowPreloader] = useState(true);
  const [exiting, setExiting] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, PRELOADER_MIN_MS - elapsed);
      const t = setTimeout(() => setExiting(true), remaining);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (!showPreloader) {
    return <AppRoutes />;
  }

  return (
    <Preloader
      fullScreen
      showSplashVideo
      exiting={exiting}
      onExitComplete={() => setShowPreloader(false)}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
