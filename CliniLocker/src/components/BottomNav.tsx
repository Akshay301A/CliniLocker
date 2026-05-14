import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, to: "/patient/dashboard" },
  { icon: FileText, to: "/patient/reports" },
  { icon: Users, to: "/patient/family" },
  { icon: Upload, to: "/patient/upload" },
  { icon: Settings, to: "/patient/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed left-3 right-3 z-50 mx-auto flex max-w-md items-center justify-around rounded-full bg-blue-600 px-1 py-2 shadow-xl md:hidden"
      style={{ bottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.to ||
          (item.to === "/patient/reports" &&
            (location.pathname === "/patient/reports" || location.pathname.startsWith("/patient/report/"))) ||
          (item.to === "/patient/family" &&
            (location.pathname === "/patient/family" || location.pathname === "/patient/family-reports"));

        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-1 items-center justify-center py-1.5 transition-all active:scale-95"
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-full transition-all",
                isActive ? "h-10 w-10 bg-white" : "h-9 w-9",
              )}
            >
              <item.icon
                className={cn(
                  "transition-all",
                  isActive ? "h-5 w-5 text-blue-600" : "h-5 w-5 text-white",
                )}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? "currentColor" : "none"}
              />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
