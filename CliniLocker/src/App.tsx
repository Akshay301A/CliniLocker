import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PatientProfileGuard } from "@/components/PatientProfileGuard";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Preloader } from "@/components/Preloader";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
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
import PatientHealthCard from "./pages/patient/HealthCard";
import PublicHealthCard from "./pages/PublicHealthCard";
import PatientCompleteProfile from "./pages/patient/CompleteProfile";
import ReportViewer from "./pages/patient/ReportViewer";
import DietPlan from "./pages/patient/DietPlan";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccount from "./pages/DeleteAccount";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import HmsLogin from "./pages/hms/Login";
import HmsDashboard from "./pages/hms/Dashboard";
import HmsPatientRegistration from "./pages/hms/PatientRegistration";
import HmsPatientProfile from "./pages/hms/PatientProfile";
import HmsNewVisit from "./pages/hms/NewVisit";
import HmsPrescription from "./pages/hms/Prescription";
import HmsBilling from "./pages/hms/Billing";
import HmsReportUpload from "./pages/hms/ReportUpload";
import HmsQrView from "./pages/hms/QrView";

const queryClient = new QueryClient();

const PRELOADER_MIN_MS = 3000;

function AppRoutes() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
          <Route path="/hms" element={<HmsLogin />} />
          <Route path="/hms/login" element={<HmsLogin />} />
          <Route path="/hms/dashboard" element={<HmsDashboard />} />
          <Route path="/hms/patients/new" element={<HmsPatientRegistration />} />
          <Route path="/hms/patients/1" element={<HmsPatientProfile />} />
          <Route path="/hms/visits/new" element={<HmsNewVisit />} />
          <Route path="/hms/prescriptions/new" element={<HmsPrescription />} />
          <Route path="/hms/billing" element={<HmsBilling />} />
          <Route path="/hms/reports" element={<HmsReportUpload />} />
          <Route path="/hms/qr/1" element={<HmsQrView />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/lab/dashboard" element={<ProtectedRoute requiredRole="lab"><LabDashboard /></ProtectedRoute>} />
          <Route path="/lab/upload" element={<ProtectedRoute requiredRole="lab"><LabUpload /></ProtectedRoute>} />
          <Route path="/lab/patients" element={<ProtectedRoute requiredRole="lab"><LabPatients /></ProtectedRoute>} />
          <Route path="/lab/reports" element={<ProtectedRoute requiredRole="lab"><LabReports /></ProtectedRoute>} />
          <Route path="/lab/settings" element={<ProtectedRoute requiredRole="lab"><LabSettings /></ProtectedRoute>} />
          <Route path="/patient/complete-profile" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientCompleteProfile /></LanguageProvider></ProtectedRoute>} />
          <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientDashboard /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/reports" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientMyReports /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/upload" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientUploadReports /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/family-reports" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientFamilyReports /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/family" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientFamilyMembers /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientMyProfile /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/health-card" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientHealthCard /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/settings" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><PatientSettings /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/report/:id" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><ReportViewer /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/patient/report/:id/diet" element={<ProtectedRoute requiredRole="patient"><PatientProfileGuard><LanguageProvider><DietPlan /></LanguageProvider></PatientProfileGuard></ProtectedRoute>} />
          <Route path="/user/:healthId" element={<PublicHealthCard />} />
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
      exiting={exiting}
      onExitComplete={() => setShowPreloader(false)}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
      <SpeedInsights />
      <Analytics />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
