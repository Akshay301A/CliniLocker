import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
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
import ReportViewer from "./pages/patient/ReportViewer";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientDashboard /></LanguageProvider></ProtectedRoute>} />
            <Route path="/patient/reports" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientMyReports /></LanguageProvider></ProtectedRoute>} />
            <Route path="/patient/upload" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientUploadReports /></LanguageProvider></ProtectedRoute>} />
            <Route path="/patient/family-reports" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientFamilyReports /></LanguageProvider></ProtectedRoute>} />
            <Route path="/patient/family" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientFamilyMembers /></LanguageProvider></ProtectedRoute>} />
            <Route path="/patient/profile" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientMyProfile /></LanguageProvider></ProtectedRoute>} />
            <Route path="/patient/settings" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><PatientSettings /></LanguageProvider></ProtectedRoute>} />
            <Route path="/patient/report/:id" element={<ProtectedRoute requiredRole="patient"><LanguageProvider><ReportViewer /></LanguageProvider></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
