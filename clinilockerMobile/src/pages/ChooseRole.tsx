import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfileRole } from "@/lib/api";

export default function ChooseRole() {
  const navigate = useNavigate();
  const { user, role, refreshRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState<"patient" | "doctor" | null>(null);

  if (!user) return <Navigate to="/patient-login" replace />;
  if (role === "lab") return <Navigate to="/lab/dashboard" replace />;
  if (role === "patient") return <Navigate to="/patient/dashboard" replace />;
  if (role === "doctor") return <Navigate to="/doctor/dashboard" replace />;

  const handlePatient = async () => {
    setLoadingRole("patient");
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Choose your CliniLocker mode
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
            Continue as patient or doctor
          </h1>
        </div>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handlePatient}
            className="w-full rounded-[28px] border border-blue-100 bg-white p-6 text-left shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <HeartPulse className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">I am a Patient</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep your records, reminders, and digital health tools in one place.
            </p>
            <Button className="mt-5 rounded-full bg-blue-600 hover:bg-blue-700" disabled={loadingRole === "patient"}>
              {loadingRole === "patient" ? "Starting..." : "Continue as Patient"}
            </Button>
          </button>

          <button
            type="button"
            onClick={() => navigate("/doctor/onboarding", { replace: true })}
            className="w-full rounded-[28px] bg-slate-950 p-6 text-left text-white shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold">I am a Doctor</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Review shared reports, receive patient QR shares, and add quick notes.
            </p>
            <Button variant="secondary" className="mt-5 rounded-full" disabled={loadingRole === "doctor"}>
              Continue as Doctor
            </Button>
          </button>
        </div>
      </div>
    </div>
  );
}
