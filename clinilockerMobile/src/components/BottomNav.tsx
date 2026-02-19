import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Home", to: "/patient/dashboard" },
  { icon: FileText, label: "Reports", to: "/patient/reports" },
  { icon: Users, label: "Family", to: "/patient/family" },
  { icon: Upload, label: "Upload", to: "/patient/upload" },
  { icon: Settings, label: "Settings", to: "/patient/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around bg-blue-600 rounded-full px-1 py-2 shadow-xl md:hidden max-w-md mx-auto">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to || 
          (item.to === "/patient/dashboard" && location.pathname === "/patient/dashboard") ||
          (item.to === "/patient/reports" && (location.pathname === "/patient/reports" || location.pathname.startsWith("/patient/report/"))) ||
          (item.to === "/patient/family" && (location.pathname === "/patient/family" || location.pathname === "/patient/family-reports")) ||
          (item.to === "/patient/upload" && location.pathname === "/patient/upload") ||
          (item.to === "/patient/settings" && location.pathname === "/patient/settings");
        
        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-center flex-1 py-1.5 transition-all active:scale-95"
          >
            <div
              className={cn(
                "flex items-center justify-center transition-all rounded-full",
                isActive ? "w-10 h-10 bg-white" : "w-9 h-9"
              )}
            >
              <item.icon
                className={cn(
                  "transition-all",
                  isActive
                    ? "h-5 w-5 text-blue-600"
                    : "h-5 w-5 text-white"
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
