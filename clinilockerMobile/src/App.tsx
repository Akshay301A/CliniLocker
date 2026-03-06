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
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
import PatientCompleteProfile from "./pages/patient/CompleteProfile";
import PatientReminders from "./pages/patient/Reminders";
import ReportViewer from "./pages/patient/ReportViewer";
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
      <DialogContent className="max-w-sm sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>{updateInfo?.title || "Update Available"}</DialogTitle>
          <DialogDescription>
            {updateInfo?.message}
          </DialogDescription>
        </DialogHeader>
        {updateInfo && (
          <p className="text-xs text-muted-foreground">
            Installed: v{updateInfo.currentVersion} | Latest: v{updateInfo.latestVersion}
          </p>
        )}
        <DialogFooter className="gap-2">
          {!updateInfo?.forceUpdate && (
            <Button variant="outline" onClick={handleLater} disabled={opening}>
              Later
            </Button>
          )}
          <Button onClick={handleUpdateNow} disabled={opening}>
            {opening ? "Opening..." : "Update Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppRoutes() {
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
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/lab/complete-signup" element={<LabCompleteSignup />} />
          <Route path="/patient-login" element={<PatientLogin />} />
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
          <Route path="/patient/settings" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientSettings /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/reminders" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientReminders /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/report/:id" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><ReportViewer /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
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
