import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { Preloader } from "@/components/Preloader";

type Role = "lab" | "patient" | "doctor";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: Role;
}) {
  const { user, role, loading, roleLoading, doctorOnboardingComplete } = useAuth();
  const { activeView } = useViewMode();
  const location = useLocation();

  if (loading) {
    return <Preloader fullScreen />;
  }

  if (!user) {
    const loginPath = requiredRole === "lab" ? "/login" : "/patient-login";
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  if (roleLoading) {
    return <Preloader fullScreen />;
  }

  if (role === null && requiredRole !== "lab") {
    return <Navigate to="/choose-role" replace />;
  }

  if (requiredRole === "patient") {
    if (role === "lab") return <Navigate to="/lab/dashboard" replace />;
    if (role === "doctor" && activeView !== "patient") return <Navigate to="/doctor/dashboard" replace />;
    return <>{children}</>;
  }

  if (requiredRole === "doctor") {
    if (role === "lab") return <Navigate to="/lab/dashboard" replace />;
    if (role !== "doctor") return <Navigate to="/patient/dashboard" replace />;
    if (!doctorOnboardingComplete && location.pathname !== "/doctor/onboarding") {
      return <Navigate to="/doctor/onboarding" replace />;
    }
    if (activeView !== "doctor" && location.pathname !== "/doctor/onboarding") {
      return <Navigate to="/patient/dashboard" replace />;
    }
    return <>{children}</>;
  }

  if (requiredRole === "lab") {
    if (role === null) return <Navigate to="/lab/complete-signup" replace />;
    if (role !== "lab") return <Navigate to="/patient/dashboard" replace />;
    return <>{children}</>;
  }

  return <>{children}</>;
}
