import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BadgeCheck, LoaderCircle, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { getProfile, verifyDoctorProfile } from "@/lib/api";

const STATE_MEDICAL_COUNCILS = [
  "Andhra Pradesh Medical Council",
  "Arunachal Pradesh Medical Council",
  "Assam Medical Council",
  "Bihar Medical Council",
  "Chattisgarh Medical Council",
  "Delhi Medical Council",
  "Goa Medical Council",
  "Gujarat Medical Council",
  "Haryana State Dental & Medical Council",
  "Himachal Pradesh Medical Council",
  "Jammu & Kashmir Medical Council",
  "Jharkhand Medical Council",
  "Karnataka Medical Council",
  "Kerala Medical Council",
  "Madhya Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Manipur Medical Council",
  "Meghalya Medical Council",
  "Mizoram Medical Council",
  "Nagaland Medical Council",
  "Orissa Medical Council",
  "Punjab Medical Council",
  "Rajasthan Medical Council",
  "Sikkim Medical Council",
  "Tamil Nadu Medical Council",
  "Telangana Medical Council",
  "Tripura Medical Council",
  "Uttarnchal Medical Council",
  "Uttar Pradesh Medical Council",
  "West Bengal Medical Council",
] as const;

export default function DoctorOnboarding() {
  const navigate = useNavigate();
  const { user, refreshRole } = useAuth();
  const { setActiveView } = useViewMode();
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [medicalCouncil, setMedicalCouncil] = useState("");
  const [registrationYear, setRegistrationYear] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then((profile) => {
      if (!profile) return;
      setFullName(profile.full_name ?? "");
      setRegistrationNumber(profile.registration_number ?? "");
      setMedicalCouncil(profile.medical_council ?? "");
      setRegistrationYear(profile.registration_year ?? "");
    });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await verifyDoctorProfile({
      doctorName: fullName,
      registrationNumber,
      stateCouncil: medicalCouncil,
      yearOfRegistration: registrationYear,
    });

    setSubmitting(false);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }

    if (!result.verified) {
      setMessage(result.message || "Verification Failed: Details do not match NMC records");
      return;
    }

    await refreshRole();
    setActiveView("doctor");
    navigate("/doctor/dashboard", { replace: true });
  };

  if (!user) return <Navigate to="/patient-login" replace />;

  if (submitting) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] px-4 py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[36px] border border-blue-100 bg-white px-8 py-16 text-center shadow-[0_28px_90px_rgba(37,99,235,0.08)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <LoaderCircle className="h-10 w-10 animate-spin" />
          </div>
          <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-950">Verification in Progress</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            We are checking your registration details against the NMC Indian Medical Register. This can take a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-blue-100 bg-white p-8 shadow-[0_28px_90px_rgba(37,99,235,0.08)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Doctor verification setup
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
            Activate your Doctor Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            We'll collect your professional details now and send them to the verification workflow. Once saved,
            you'll immediately get the doctor inbox and QR sharing tools in the app.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Your Name" />
            </div>
            <div>
              <Label htmlFor="registration-number">Medical Registration Number</Label>
              <Input
                id="registration-number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. APMC/12345"
              />
            </div>
            <div>
              <Label htmlFor="medical-council">State Council</Label>
              <select
                id="medical-council"
                value={medicalCouncil}
                onChange={(e) => setMedicalCouncil(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select State Medical Council</option>
                {STATE_MEDICAL_COUNCILS.map((council) => (
                  <option key={council} value={council}>{council}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="registration-year">Year of Registration (Optional)</Label>
              <Input
                id="registration-year"
                value={registrationYear}
                onChange={(e) => setRegistrationYear(e.target.value)}
                placeholder="e.g. 2018"
                inputMode="numeric"
              />
            </div>
            {message && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}
            <Button type="submit" className="h-12 rounded-full bg-blue-600 px-8 hover:bg-blue-700" disabled={submitting}>
              {submitting ? "Submitting..." : "Verify and open Doctor Mode"}
            </Button>
          </form>
        </div>

        <div className="rounded-[36px] bg-slate-950 p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">What opens after verification setup</h2>
          <div className="mt-6 space-y-4">
            {[
              "A doctor inbox with new patient shares in real time",
              "A QR code carrying your doctor UUID for patient scan-to-share",
              "Split report review with space for private quick notes",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-4">
                <BadgeCheck className="mt-0.5 h-5 w-5 text-blue-300" />
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

