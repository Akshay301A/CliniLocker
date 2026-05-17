import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminStats, getFounding500AdminDashboard, getProfile, updateFounding500AdminReview } from "@/lib/api";

const Admin = () => {
  const { user, loading, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [campaignData, setCampaignData] = useState<Awaited<ReturnType<typeof getFounding500AdminDashboard>> | null>(null);
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
      try {
        const campaign = await getFounding500AdminDashboard();
        if (!active) return;
        setCampaignData(campaign);
      } catch (campaignError) {
        if (!active) return;
        setError(campaignError instanceof Error ? campaignError.message : "Unable to load campaign dashboard.");
      }
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
              <div className="mt-8 space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-2xl bg-white p-6 shadow-card">
                  <p className="text-sm text-muted-foreground">Total User Accounts</p>
                  <p className="mt-3 text-3xl font-extrabold text-foreground">
                    {totalUsers ?? (error ? "--" : "...")}
                  </p>
                  {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                </div>
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <p className="text-sm text-muted-foreground">Founding Slots Left</p>
                    <p className="mt-3 text-3xl font-extrabold text-foreground">
                      {campaignData?.analytics.remainingSlots ?? "..."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <p className="text-sm text-muted-foreground">Kits Claimed</p>
                    <p className="mt-3 text-3xl font-extrabold text-foreground">
                      {campaignData?.analytics.kitsClaimed ?? "..."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <p className="text-sm text-muted-foreground">Eligible Users</p>
                    <p className="mt-3 text-3xl font-extrabold text-foreground">
                      {campaignData?.analytics.eligibleUsers ?? "..."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <p className="text-sm text-muted-foreground">Pending Validations</p>
                    <p className="mt-3 text-3xl font-extrabold text-foreground">
                      {campaignData?.analytics.pendingValidations ?? "..."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <p className="text-sm text-muted-foreground">Suspicious Activity</p>
                    <p className="mt-3 text-3xl font-extrabold text-foreground">
                      {campaignData?.analytics.suspiciousUsers ?? "..."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="rounded-2xl bg-white p-6 shadow-card">
                    <h2 className="text-lg font-bold text-foreground">Emergency Identity Activations</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Eligibility, validations, and suspicious activity review.
                    </p>
                    <div className="mt-5 space-y-3">
                      {(campaignData?.activations ?? []).length > 0 ? (
                        campaignData?.activations.map((activation) => (
                          <div key={String(activation.user_id)} className="rounded-xl border border-border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-foreground">{String(activation.user_id).slice(0, 8)}…</p>
                                <p className="text-xs text-muted-foreground">{String(activation.phone ?? "No phone")}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-foreground">{String(activation.eligibility_status ?? "inactive")}</p>
                                {activation.founding_member_id && (
                                  <p className="text-xs text-emerald-600">{String(activation.founding_member_id)}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>Records: {String(activation.medical_records_count ?? 0)}</span>
                              <span>Review: {String(activation.admin_review_status ?? "clean")}</span>
                              {activation.suspicious_flag && (
                                <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                                  Suspicious
                                </span>
                              )}
                            </div>
                            {activation.suspicious_reason && (
                              <p className="mt-2 text-xs text-amber-700">{String(activation.suspicious_reason)}</p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                                onClick={async () => {
                                  await updateFounding500AdminReview(String(activation.user_id), "approved");
                                  setCampaignData(await getFounding500AdminDashboard());
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                                onClick={async () => {
                                  await updateFounding500AdminReview(String(activation.user_id), "review");
                                  setCampaignData(await getFounding500AdminDashboard());
                                }}
                              >
                                Mark Review
                              </button>
                              <button
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                  await updateFounding500AdminReview(String(activation.user_id), "rejected");
                                  setCampaignData(await getFounding500AdminDashboard());
                                }}
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No activation records yet.</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-white p-6 shadow-card">
                    <h2 className="text-lg font-bold text-foreground">Emergency Kit Orders</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Payment status, shipping destinations, and suspicious orders.
                    </p>
                    <div className="mt-5 space-y-3">
                      {(campaignData?.orders ?? []).length > 0 ? (
                        campaignData?.orders.map((order) => (
                          <div key={String(order.id)} className="rounded-xl border border-border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-foreground">{String(order.shipping_name ?? "Unknown recipient")}</p>
                                <p className="text-xs text-muted-foreground">
                                  {String(order.shipping_city ?? "")}, {String(order.shipping_state ?? "")} • {String(order.shipping_pincode ?? "")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-foreground">{String(order.status ?? "created")}</p>
                                <p className="text-xs text-muted-foreground">{String(order.pricing_mode ?? "launch_offer")}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>Phone: {String(order.shipping_phone ?? "—")}</span>
                              <span>Total: ₹{Math.round(Number(order.total_amount ?? 0) / 100)}</span>
                              {order.suspicious_flag && (
                                <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                                  Suspicious
                                </span>
                              )}
                            </div>
                            {order.suspicious_reason && (
                              <p className="mt-2 text-xs text-amber-700">{String(order.suspicious_reason)}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No orders yet.</p>
                      )}
                    </div>
                  </section>
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
