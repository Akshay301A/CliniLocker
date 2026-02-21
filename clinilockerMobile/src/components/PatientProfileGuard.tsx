import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProfile, isProfileComplete, ensureProfileExists } from "@/lib/api";

/** For patient routes: if profile is incomplete, redirect to /patient/complete-profile. Skip redirect when already on complete-profile. */
export function PatientProfileGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  const isCompleteProfilePage = location.pathname === "/patient/complete-profile";

  useEffect(() => {
    if (isCompleteProfilePage) {
      setComplete(true);
      setLoading(false);
      return;
    }
    getProfile().then(async (profile) => {
      if (!profile) await ensureProfileExists();
      const p = profile ?? (await getProfile());
      setComplete(isProfileComplete(p));
      setLoading(false);
    });
  }, [isCompleteProfilePage]);

  useEffect(() => {
    if (loading) return;
    if (isCompleteProfilePage) return;
    if (!complete) {
      navigate("/patient/complete-profile", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, complete, isCompleteProfilePage, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isCompleteProfilePage && !complete) {
    return null;
  }

  return <>{children}</>;
}
