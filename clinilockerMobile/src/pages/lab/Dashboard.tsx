import { useState, useEffect } from "react";
import { LabLayout } from "@/components/LabLayout";
import { Preloader } from "@/components/Preloader";
import { FileText, Users, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLabStats, getLabReports } from "@/lib/api";
import type { Report } from "@/lib/supabase";

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return d.toLocaleDateString();
}

const LabDashboard = () => {
  const { labId } = useAuth();
  const [stats, setStats] = useState({ totalReports: 0, reportsThisMonth: 0, totalPatients: 0 });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!labId) return;
    let mounted = true;
    Promise.all([getLabStats(labId), getLabReports(labId)]).then(([s, reports]) => {
      if (mounted) {
        setStats(s);
        setRecentReports(reports.slice(0, 5));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [labId]);

  if (loading) {
    return (
      <LabLayout>
        <Preloader />
      </LabLayout>
    );
  }

  return (
    <LabLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Here's an overview of your lab activity.</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileText, label: "Total Reports Sent", value: String(stats.totalReports), color: "text-primary" },
            { icon: Calendar, label: "Reports This Month", value: String(stats.reportsThisMonth), color: "text-accent" },
            { icon: Users, label: "Total Patients", value: String(stats.totalPatients), color: "text-success" },
            { icon: TrendingUp, label: "Growth", value: stats.totalReports > 0 ? "—" : "0", color: "text-warning" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="border-b border-border p-3 sm:p-4 md:p-6">
            <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {recentReports.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No reports yet. Upload your first report.</div>
            ) : (
              recentReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 md:px-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.patient_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.test_name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(r.uploaded_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </LabLayout>
  );
};

export default LabDashboard;
