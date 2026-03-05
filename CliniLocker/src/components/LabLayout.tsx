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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <img
            src="/logo%20(2).png"
            alt="CliniLocker"
            className="h-9 w-auto shrink-0 object-contain object-left sm:h-10"
          />
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1 p-3">
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
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-col min-w-0 md:pl-64">
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
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="group ml-auto flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-end overflow-hidden rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-300 hover:w-24 sm:hover:w-28 hover:bg-destructive/10 hover:text-destructive focus-visible:w-24 sm:focus-visible:w-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="absolute mr-10 sm:mr-11 whitespace-nowrap text-xs sm:text-sm font-medium opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0">
              Logout
            </span>
            <span className="mr-[9px] sm:mr-[10px]">
              <LogOut className="h-4 w-4" />
            </span>
          </button>
        </header>
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
