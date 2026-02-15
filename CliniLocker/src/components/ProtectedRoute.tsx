import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "lab" | "patient";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: Role;
}) {
  const { user, role, loading, roleLoading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    const loginPath = requiredRole === "lab" ? "/login" : "/patient-login";
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole === "patient") {
    if (role === "lab") return <Navigate to="/lab/dashboard" replace />;
    return <>{children}</>;
  }

  if (requiredRole === "lab") {
    if (roleLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }
    if (role === null) return <Navigate to="/lab/complete-signup" replace />;
    if (role !== "lab") return <Navigate to="/patient/dashboard" replace />;
    return <>{children}</>;
  }

  return <>{children}</>;
}
