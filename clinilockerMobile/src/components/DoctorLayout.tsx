import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Settings, Repeat2, LogOut, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";

const navItems = [
  { icon: LayoutDashboard, label: "Inbox", to: "/doctor/dashboard" },
  { icon: Settings, label: "Settings", to: "/doctor/settings" },
];

export function DoctorLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { setActiveView } = useViewMode();

  const handleSwitchToPatient = () => {
    setActiveView("patient");
    navigate("/patient/dashboard");
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">Doctor Mode</p>
              <h1 className="text-lg font-bold text-slate-950">
                {location.pathname === "/doctor/settings" ? "Doctor Settings" : "Doctor Inbox"}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSwitchToPatient}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
          >
            Patient View
          </button>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-w-[96px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${
                  active ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-w-[96px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
