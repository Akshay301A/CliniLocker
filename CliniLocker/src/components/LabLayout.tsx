import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, Users, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/lab/dashboard", iconColor: "text-blue-600" },
  { icon: Upload, label: "Upload Report", to: "/lab/upload", iconColor: "text-amber-600" },
  { icon: Users, label: "Patients", to: "/lab/patients", iconColor: "text-violet-600" },
  { icon: FileText, label: "Reports", to: "/lab/reports", iconColor: "text-emerald-600" },
  { icon: Settings, label: "Settings", to: "/lab/settings", iconColor: "text-slate-600" },
];

export function LabLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary overflow-hidden">
            <img src="/Logo.svg" alt="CliniLocker" className="h-4 w-4 object-contain" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">CliniLocker</span>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary/15" : "bg-muted/80"}`}>
                  <item.icon className={`h-4 w-4 ${item.iconColor || "text-sidebar-foreground"}`} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive/90"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/80">
              <LogOut className="h-4 w-4 text-destructive" />
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 min-h-[3.5rem] sm:h-16 items-center border-b border-border bg-card px-3 sm:px-4 md:px-6 gap-2">
          <button
            type="button"
            className="touch-target flex shrink-0 md:hidden -ml-1 items-center justify-center rounded-md text-foreground hover:bg-muted/80"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground truncate">
            {navItems.find((i) => i.to === location.pathname)?.label || "Dashboard"}
          </h2>
        </header>
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
