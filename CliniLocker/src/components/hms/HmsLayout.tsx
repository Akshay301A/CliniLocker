import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  FileUp,
  Settings,
  LogOut,
  Search,
  Bell,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/hms/dashboard", icon: LayoutDashboard },
  { label: "Patients", to: "/hms/patients/new", icon: Users },
  { label: "Visits", to: "/hms/visits/new", icon: CalendarDays },
  { label: "Billing", to: "/hms/billing", icon: CreditCard },
  { label: "Reports", to: "/hms/reports", icon: FileUp },
];

export function HmsLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-low flex flex-col p-4 space-y-2 z-40">
        <div className="px-3 py-5 flex items-start gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">CliniLocker HMS</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface/50 font-bold">
              Medical Management
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                  active
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface/70 hover:text-primary hover:bg-surface"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-on-surface-variant/10 space-y-1">
          <Link
            to="/hms/settings"
            className="flex items-center gap-3 px-3 py-2 text-on-surface/70 hover:text-primary rounded-lg font-medium transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            className="flex items-center gap-3 px-3 py-2 text-on-surface/70 hover:text-primary rounded-lg font-medium transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] px-8 py-3 flex items-center justify-between gap-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
            <input
              className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Search patients or records..."
            />
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/hms/patients/new"
              className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <span>+ Add Patient</span>
            </Link>
            <button className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-lg transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface tracking-tight">Dr. Julian Vance</p>
                <p className="text-[10px] text-on-surface-variant/60">Senior Cardiologist</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-surface-container-highest ring-2 ring-white" />
            </div>
          </div>
        </header>
        <div className="p-8 max-w-[1400px] mx-auto space-y-10">{children}</div>
      </main>
    </div>
  );
}

