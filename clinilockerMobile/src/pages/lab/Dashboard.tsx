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
      <div className="space-y-3 md:space-y-4 animate-fade-in pb-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">Welcome back!</h1>
          <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">Here's an overview of your lab activity.</p>
        </div>

        <div className="grid gap-2.5 md:gap-3 grid-cols-2">
          {[
            { icon: FileText, label: "Total Reports Sent", value: String(stats.totalReports), bg: "from-blue-500 to-blue-600", iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
            { icon: Calendar, label: "Reports This Month", value: String(stats.reportsThisMonth), bg: "from-amber-500 to-amber-600", iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
            { icon: Users, label: "Total Patients", value: String(stats.totalPatients), bg: "from-emerald-500 to-emerald-600", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
            { icon: TrendingUp, label: "Growth", value: stats.totalReports > 0 ? "—" : "0", bg: "from-violet-500 to-violet-600", iconBg: "bg-violet-500/10", iconColor: "text-violet-600" },
          ].map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-3 md:p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg ${s.iconBg} ${s.iconColor}`}>
                    <s.icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-3 md:p-4 bg-gradient-to-r from-muted/50 to-transparent">
            <h3 className="font-display text-base md:text-lg font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {recentReports.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground font-medium">No reports yet. Upload your first report.</p>
              </div>
            ) : (
              <>
                {recentReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 md:px-6">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.patient_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.test_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(r.uploaded_at)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </LabLayout>
  );
};

export default LabDashboard;
