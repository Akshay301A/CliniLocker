import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Settings, Repeat2, LogOut, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";

const navItems = [
  { icon: LayoutDashboard, label: "Doctor Inbox", to: "/doctor/dashboard" },
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
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Doctor Mode</p>
            <h1 className="text-lg font-bold text-slate-900">CliniLocker</h1>
          </div>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleSwitchToPatient}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Repeat2 className="h-4 w-4" />
            Switch to Patient View
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Verified Sharing</p>
              <h2 className="text-lg font-bold text-slate-900">
                {location.pathname === "/doctor/settings" ? "Doctor Settings" : "Patient Shares Inbox"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSwitchToPatient}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              <Repeat2 className="h-4 w-4" />
              Patient View
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
