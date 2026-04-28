import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type ActiveViewMode = "patient" | "doctor";

type ViewModeContextType = {
  activeView: ActiveViewMode;
  canSwitchProfiles: boolean;
  setActiveView: (view: ActiveViewMode) => void;
};

const STORAGE_KEY = "clinilocker_active_view";

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [activeView, setActiveViewState] = useState<ActiveViewMode>("patient");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "patient" || stored === "doctor") {
      setActiveViewState(stored);
    }
  }, []);

  useEffect(() => {
    if (role === "doctor") {
      setActiveViewState((prev) => {
        const next = prev === "patient" ? "patient" : "doctor";
        localStorage.setItem(STORAGE_KEY, next);
        return next;
      });
      return;
    }
    setActiveViewState("patient");
    localStorage.setItem(STORAGE_KEY, "patient");
  }, [role]);

  const value = useMemo<ViewModeContextType>(() => ({
    activeView,
    canSwitchProfiles: role === "doctor",
    setActiveView: (view) => {
      const next = role === "doctor" ? view : "patient";
      setActiveViewState(next);
      localStorage.setItem(STORAGE_KEY, next);
    },
  }), [activeView, role]);

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}
