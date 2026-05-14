import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Upload,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ensureHealthCardExists, getProfile } from "@/lib/api";
import type { HealthCardRow, Profile } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import HealthCardDisplay from "@/components/patient/HealthCardDisplay";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/patient/dashboard" },
  { icon: FileText, label: "My Reports", to: "/patient/reports" },
  { icon: Users, label: "Family Members", to: "/patient/family" },
  { icon: Upload, label: "Upload Reports", to: "/patient/upload" },
  { icon: Settings, label: "Settings", to: "/patient/settings" },
];

export function PatientLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [healthCardOpen, setHealthCardOpen] = useState(false);
  const [healthCardLoading, setHealthCardLoading] = useState(false);
  const [healthCardError, setHealthCardError] = useState<string | null>(null);
  const [healthCardData, setHealthCardData] = useState<HealthCardRow | null>(null);
  const healthCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p ?? null);
      if (p?.avatar_url) setAvatarUrl(p.avatar_url);
      else setAvatarUrl(null);
      if (p?.full_name) setProfileName(p.full_name);
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!healthCardOpen) return;
    let mounted = true;
    setHealthCardLoading(true);
    setHealthCardError(null);
    ensureHealthCardExists(profile)
      .then((card) => {
        if (!mounted) return;
        if (!card) {
          setHealthCardError(t("Unable to load health card"));
          return;
        }
        setHealthCardData(card);
      })
      .catch(() => {
        if (!mounted) return;
        setHealthCardError(t("Unable to load health card"));
      })
      .finally(() => {
        if (!mounted) return;
        setHealthCardLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [healthCardOpen, profile, t]);

  const isActive = (to: string) => {
    if (to === "/patient/reports") return location.pathname === to || location.pathname.startsWith("/patient/report/");
    if (to === "/patient/family") return location.pathname === to || location.pathname === "/patient/family-reports";
    return location.pathname === to;
  };

  const handleLogout = async () => {
    await signOut();
    toast.success(t("Logged out"));
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen lg:h-screen">
        <aside className="hidden h-screen w-[274px] shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col lg:overflow-hidden">
          <Link
            to="/patient/dashboard"
            className="mb-8 flex h-[132px] items-center rounded-[22px] border border-slate-200 bg-white px-4 shadow-sm"
          >
            <img src="/logo%20(2).png" alt="CliniLocker" className="h-40 w-auto object-contain object-left" />
          </Link>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={profileName ?? t("Profile")} />}
                <AvatarFallback className="bg-blue-100 text-lg font-semibold text-blue-700">
                  {profileName ? profileName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <p className="mt-4 font-display text-lg font-semibold text-slate-900">{profileName ?? "CliniLocker User"}</p>
              <p className="text-sm text-slate-500">{t("Secure health records")}</p>
            </div>
          </div>

          <nav className="space-y-2.5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all ${
                  isActive(item.to)
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t(item.label)}</span>
              </Link>
            ))}
          </nav>

        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
          <header
            className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3.5 pb-2 pt-2 sm:px-4 md:px-8 md:py-5"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.14rem)" }}
          >
            <div className="flex items-center gap-3">
              <Link to="/patient/dashboard" className="flex items-center lg:hidden" aria-label="Home">
                <img src="/favicon.png" alt="CliniLocker" className="h-[3rem] w-[3rem] object-contain" />
              </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setHealthCardOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 md:h-11 md:w-11"
                aria-label={t("Digital Health Card")}
              >
                <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              <Link
                to="/patient/profile"
                className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
                aria-label={t("Profile")}
              >
                <Avatar className="h-10 w-10 border-2 border-slate-100 md:h-11 md:w-11">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={profileName ?? t("Profile")} />}
                  <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                    {profileName ? profileName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                aria-label={t("Logout")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden px-3.5 py-3 pb-24 sm:px-4 sm:py-4 md:px-8 md:py-8 md:pb-8 lg:overflow-y-auto xl:px-10">
            <div className="min-h-0">{children}</div>
          </main>
        </div>
      </div>

      <BottomNav />

      <Dialog open={healthCardOpen} onOpenChange={setHealthCardOpen}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{t("Digital Health Card")}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {healthCardLoading && (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {t("Loading health card...")}
              </div>
            )}
            {!healthCardLoading && healthCardError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {healthCardError}
              </div>
            )}
            {!healthCardLoading && !healthCardError && healthCardData && (
              <HealthCardDisplay card={healthCardData} containerRef={healthCardRef} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
