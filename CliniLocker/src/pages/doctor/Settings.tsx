import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DoctorLayout } from "@/components/DoctorLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";

export default function DoctorSettings() {
  const { isVerified } = useAuth();
  const { activeView, setActiveView } = useViewMode();
  const [doctorMode, setDoctorMode] = useState(activeView === "doctor");

  const handleSwitch = (checked: boolean) => {
    setDoctorMode(checked);
    setActiveView(checked ? "doctor" : "patient");
  };

  return (
    <DoctorLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">Doctor Settings</h1>
              <p className="text-sm text-slate-500">Switch views without logging out and review your doctor verification status.</p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-slate-900">Switch Profile</p>
                <p className="mt-1 text-sm text-slate-500">
                  Toggle between Doctor View and Patient View using the same logged-in account.
                </p>
              </div>
              <Switch checked={doctorMode} onCheckedChange={handleSwitch} />
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant={doctorMode ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleSwitch(true)}
              >
                Doctor View
              </Button>
              <Button
                variant={!doctorMode ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleSwitch(false)}
              >
                Patient View
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Verification status</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{isVerified ? "Verified doctor" : "Verification pending"}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This page only changes the navigation stack and visible experience. It never signs the user out or swaps the authenticated session.
          </p>
        </div>
      </div>
    </DoctorLayout>
  );
}
