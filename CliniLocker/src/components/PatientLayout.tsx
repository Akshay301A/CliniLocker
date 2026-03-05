import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, Users, Share2, Settings, LogOut, Menu, X, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfile } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppFooter } from "@/components/AppFooter";

const navItems = [
  { icon: LayoutDashboard, labelKey: "Dashboard", to: "/patient/dashboard", iconColor: "text-blue-600" },
  { icon: FileText, labelKey: "My Reports", to: "/patient/reports", iconColor: "text-emerald-600" },
  { icon: Share2, labelKey: "Family Reports", to: "/patient/family-reports", iconColor: "text-indigo-600" },
  { icon: Upload, labelKey: "Upload Reports", to: "/patient/upload", iconColor: "text-amber-600" },
  { icon: Users, labelKey: "Family Members", to: "/patient/family", iconColor: "text-violet-600" },
  { icon: User, labelKey: "My Profile", to: "/patient/profile", iconColor: "text-teal-600" },
  { icon: Settings, labelKey: "Settings", to: "/patient/settings", iconColor: "text-slate-600" },
];

export function PatientLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then((p) => {
      if (p?.avatar_url) setAvatarUrl(p.avatar_url);
      else setAvatarUrl(null);
      if (p?.full_name) setProfileName(p.full_name);
    });
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    toast.success(t("Logged out"));
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
            className="h-[150px] w-auto shrink-0 object-contain object-left"
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
                {t(item.labelKey)}
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
            aria-label={t("Open menu")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            to="/patient/dashboard"
            className="font-display text-lg font-bold text-foreground shrink-0 hidden sm:inline hover:opacity-90"
          >
            CliniLocker
          </Link>
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground truncate">
            {location.pathname.match(/^\/patient\/report\/[^/]+$/)
              ? t("View Report")
              : t(navItems.find((i) => i.to === location.pathname)?.labelKey || "Dashboard")}
          </h2>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              to="/patient/profile"
              className="flex shrink-0 items-center justify-center rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={t("My Profile")}
            >
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={profileName ?? t("Profile")} />}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={t("Logout")}
              className="group flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-end overflow-hidden rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-300 hover:w-28 sm:hover:w-32 hover:bg-destructive/10 hover:text-destructive focus-visible:w-28 sm:focus-visible:w-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="absolute mr-10 sm:mr-11 whitespace-nowrap text-xs sm:text-sm font-medium opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0">
                {t("Logout")}
              </span>
              <span className="mr-[9px] sm:mr-[10px]">
                <LogOut className="h-4 w-4" />
              </span>
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 overflow-x-hidden">
          <div className="flex-1 min-h-0">{children}</div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
