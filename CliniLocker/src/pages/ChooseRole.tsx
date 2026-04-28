import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { HeartPulse, Stethoscope, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfileRole } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ChooseRole() {
  const navigate = useNavigate();
  const { user, role, refreshRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState<"patient" | "doctor" | null>(null);

  if (!user) return <Navigate to="/patient-login" replace />;
  if (role === "lab") return <Navigate to="/lab/dashboard" replace />;
  if (role === "patient") return <Navigate to="/patient/dashboard" replace />;
  if (role === "doctor") return <Navigate to="/doctor/dashboard" replace />;

  const handleSelect = async (role: "patient" | "doctor") => {
    setLoadingRole(role);
    if (role === "doctor") {
      navigate("/doctor/onboarding", { replace: true });
      return;
    }
    const result = await updateProfileRole("patient");
    if (result && "error" in result) {
      setLoadingRole(null);
      return;
    }
    await refreshRole();
    setLoadingRole(null);
    navigate("/patient/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_45%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            One secure account, two professional modes
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Choose how you want to use CliniLocker
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Pick your primary role first. Doctors can later switch into Patient View without signing out.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => handleSelect("patient")}
            className="group rounded-[32px] border border-blue-100 bg-white p-8 text-left shadow-[0_24px_80px_rgba(37,99,235,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(37,99,235,0.14)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <HeartPulse className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-950">I am a Patient</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep your reports, reminders, diet plans, and digital health card in one place.
            </p>
            <div className="mt-8">
              <Button className="rounded-full bg-blue-600 px-6 hover:bg-blue-700" disabled={loadingRole === "patient"}>
                {loadingRole === "patient" ? "Starting..." : "Continue as Patient"}
              </Button>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("doctor")}
            className="group rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-left shadow-[0_28px_90px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:shadow-[0_30px_100px_rgba(15,23,42,0.3)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Stethoscope className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">I am a Doctor</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Receive patient shares, review reports, add quick notes, and verify your doctor profile.
            </p>
            <div className="mt-8">
              <Button variant="secondary" className="rounded-full px-6" disabled={loadingRole === "doctor"}>
                {loadingRole === "doctor" ? "Opening..." : "Continue as Doctor"}
              </Button>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
