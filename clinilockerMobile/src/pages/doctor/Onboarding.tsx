import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BadgeCheck, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { getProfile, verifyDoctorProfile } from "@/lib/api";

export default function DoctorOnboarding() {
  const navigate = useNavigate();
  const { user, refreshRole } = useAuth();
  const { setActiveView } = useViewMode();
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [medicalCouncil, setMedicalCouncil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then((profile) => {
      if (!profile) return;
      setFullName(profile.full_name ?? "");
      setRegistrationNumber(profile.registration_number ?? "");
      setMedicalCouncil(profile.medical_council ?? "");
    });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await verifyDoctorProfile({
      fullName,
      registrationNumber,
      medicalCouncil,
    });

    setSubmitting(false);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }

    await refreshRole();
    setActiveView("doctor");
    navigate("/doctor/dashboard", { replace: true });
  };

  if (!user) return <Navigate to="/patient-login" replace />;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] px-4 py-8">
      <div className="mx-auto max-w-md space-y-5">
        <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Doctor verification
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Activate Doctor Mode</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add your professional details now. We'll submit them to the verification placeholder and open the doctor inbox.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Your Name" />
            </div>
            <div>
              <Label htmlFor="registration-number">Medical Registration Number</Label>
              <Input id="registration-number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="medical-council">State Council</Label>
              <Input id="medical-council" value={medicalCouncil} onChange={(e) => setMedicalCouncil(e.target.value)} />
            </div>
            {message && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
            <Button type="submit" className="h-12 w-full rounded-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? "Submitting..." : "Verify and Continue"}
            </Button>
          </form>
        </div>

        <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              "Realtime patient shares inbox",
              "Doctor UUID QR for scan-to-share",
              "Quick notes on shared reports",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-4">
                <BadgeCheck className="mt-0.5 h-5 w-5 text-blue-300" />
                <p className="text-sm text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

