import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminStats, getProfile } from "@/lib/api";

const Admin = () => {
  const { user, loading, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    if (loading) return;
    if (!user) {
      navigate(`/patient-login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }
    (async () => {
      const profile = await getProfile();
      if (!active) return;
      const adminFlag = !!profile?.is_admin;
      setIsAdmin(adminFlag);
      if (!adminFlag) return;
      const stats = await getAdminStats(session?.access_token);
      if (!active) return;
      if ("error" in stats) setError(stats.error);
      else setTotalUsers(stats.totalUsers);
    })();
    return () => {
      active = false;
    };
  }, [user, loading, navigate, location.pathname]);

  return (
    <div className="landing-theme min-h-screen bg-background">
      <Navbar />
      <main className="pt-28">
        <section className="py-12 sm:py-16 md:py-20">
          <div className="container px-4 max-w-4xl mx-auto">
            <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Admin-only metrics for CliniLocker.
            </p>

            {user && isAdmin === false && (
              <div className="mt-8 rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-muted-foreground">You do not have admin access.</p>
              </div>
            )}

            {user && isAdmin && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-card">
                  <p className="text-sm text-muted-foreground">Total User Accounts</p>
                  <p className="mt-3 text-3xl font-extrabold text-foreground">
                    {totalUsers ?? (error ? "--" : "...")}
                  </p>
                  {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
