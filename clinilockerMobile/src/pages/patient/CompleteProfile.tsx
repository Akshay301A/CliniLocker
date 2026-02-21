import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, updateProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User } from "lucide-react";

const PatientCompleteProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string })?.from || "/patient/dashboard";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date_of_birth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [blood_group, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [phoneFromLogin, setPhoneFromLogin] = useState(false);

  useEffect(() => {
    Promise.all([supabase.auth.getUser(), getProfile()]).then(([{ data: { user } }, p]) => {
      const profilePhone = p?.phone?.trim() ?? "";
      const authPhone = user?.phone?.trim() ?? "";
      const displayPhone = profilePhone || authPhone;
      setPhoneFromLogin(!!authPhone && displayPhone === authPhone);
      if (p) {
        setFullName(p.full_name ?? "");
        setPhone(displayPhone);
        setEmail(p.email ?? "");
        setDateOfBirth(p.date_of_birth ?? "");
        setGender(p.gender ?? "");
        setBloodGroup(p.blood_group ?? "");
        setAddress(p.address ?? "");
      } else {
        setPhone(displayPhone);
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = full_name.trim();
    const phoneTrim = phone.trim();
    if (!nameTrim) {
      toast.error("Full name is required.");
      return;
    }
    if (!phoneTrim) {
      toast.error("Phone number is required.");
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      full_name: nameTrim,
      phone: phoneTrim || null,
      email: email.trim() || null,
      date_of_birth: date_of_birth.trim() || null,
      gender: gender.trim() || null,
      blood_group: blood_group.trim() || null,
      address: address.trim() || null,
    });
    setSaving(false);
    if (result && "error" in result) {
      toast.error(result.error || "Failed to save.");
      return;
    }
    toast.success("Profile saved! Taking you to the dashboard.");
    navigate(returnTo, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-md">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">Complete your profile</h1>
            <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">
              Add your details so we can personalize your experience. You can update these later in Profile.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                className="min-h-[44px] mt-1.5 rounded-lg"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                className="min-h-[44px] mt-1.5 rounded-lg"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                readOnly={phoneFromLogin}
                required
              />
              {phoneFromLogin && (
                <p className="mt-1 text-xs text-muted-foreground">Same number you signed in with</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="min-h-[44px] mt-1.5 rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                className="min-h-[44px] mt-1.5 rounded-lg"
                value={date_of_birth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="blood_group">Blood Group</Label>
              <select
                id="blood_group"
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={blood_group}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                className="min-h-[44px] mt-1.5 rounded-lg"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your address"
              />
            </div>
            <Button type="submit" className="w-full min-h-[48px] rounded-lg text-sm font-medium" disabled={saving}>
              {saving ? "Saving…" : "Save and continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientCompleteProfile;
