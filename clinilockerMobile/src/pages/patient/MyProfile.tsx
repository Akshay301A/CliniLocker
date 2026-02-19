import { useState, useEffect, useRef } from "react";
import { PatientLayout } from "@/components/PatientLayout";
import { Preloader } from "@/components/Preloader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Pencil, Camera, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import { getProfile, updateProfile, uploadAvatar } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Profile } from "@/lib/supabase";

type ProfileForm = {
  full_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
};

type EmergencyForm = {
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
};

type VitalsForm = {
  blood_pressure?: string;
  weight?: string;
};

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return s;
  }
}

const PatientMyProfile = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingVitals, setEditingVitals] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [personalForm, setPersonalForm] = useState<ProfileForm>({});
  const [vitalsForm, setVitalsForm] = useState<VitalsForm>({});
  const [emergencyForm, setEmergencyForm] = useState<EmergencyForm>({});
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = () => {
    getProfile().then((p) => {
      if (p) {
        setProfile(p);
        setPersonalForm({
          full_name: p.full_name ?? "",
          phone: p.phone ?? "",
          email: p.email ?? "",
          date_of_birth: p.date_of_birth ?? "",
          gender: p.gender ?? "",
          blood_group: p.blood_group ?? "",
          address: p.address ?? "",
        });
        setVitalsForm({
          blood_pressure: p.blood_pressure ?? "",
          weight: p.weight != null ? String(p.weight) : "",
        });
        setEmergencyForm({
          emergency_contact_name: p.emergency_contact_name ?? "",
          emergency_contact_relation: p.emergency_contact_relation ?? "",
          emergency_contact_phone: p.emergency_contact_phone ?? "",
        });
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    const result = await updateProfile(personalForm);
    setSavingPersonal(false);
    if (result && "error" in result) {
      toast.error(result.error || t("Failed to update profile."));
      return;
    }
    if (result) {
      setProfile((prev) => (prev ? { ...prev, ...result } : result));
      setEditingPersonal(false);
      toast.success(t("Profile updated successfully!"));
    } else {
      toast.error(t("Failed to update profile."));
    }
  };

  const handleCancelPersonal = () => {
    setPersonalForm({
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      date_of_birth: profile?.date_of_birth ?? "",
      gender: profile?.gender ?? "",
      blood_group: profile?.blood_group ?? "",
      address: profile?.address ?? "",
    });
    setEditingPersonal(false);
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVitals(true);
    const payload = {
      blood_pressure: vitalsForm.blood_pressure?.trim() || null,
      weight: vitalsForm.weight?.trim() ? Number(vitalsForm.weight) : null,
    };
    const result = await updateProfile(payload);
    setSavingVitals(false);
    if (result && "error" in result) {
      toast.error(result.error || t("Failed to update vitals."));
      return;
    }
    if (result) {
      setProfile((prev) => (prev ? { ...prev, ...result } : result));
      setEditingVitals(false);
      toast.success(t("BP & weight updated!"));
    } else {
      toast.error(t("Failed to update vitals."));
    }
  };

  const handleCancelVitals = () => {
    setVitalsForm({
      blood_pressure: profile?.blood_pressure ?? "",
      weight: profile?.weight != null ? String(profile.weight) : "",
    });
    setEditingVitals(false);
  };

  const handleSaveEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmergency(true);
    const result = await updateProfile(emergencyForm);
    setSavingEmergency(false);
    if (result && "error" in result) {
      toast.error(result.error || "Failed to update emergency contact.");
      return;
    }
    if (result) {
      setProfile((prev) => (prev ? { ...prev, ...result } : result));
      setEditingEmergency(false);
      toast.success(t("Emergency contact saved!"));
    } else {
      toast.error(t("Failed to update emergency contact."));
    }
  };

  const handleCancelEmergency = () => {
    setEmergencyForm({
      emergency_contact_name: profile?.emergency_contact_name ?? "",
      emergency_contact_relation: profile?.emergency_contact_relation ?? "",
      emergency_contact_phone: profile?.emergency_contact_phone ?? "",
    });
    setEditingEmergency(false);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error(t("Please select an image (JPEG, PNG, WebP, or GIF)."));
      return;
    }
    setUploadingAvatar(true);
    const result = await uploadAvatar(file);
    setUploadingAvatar(false);
    if ("error" in result) {
      toast.error(result.error || t("Failed to upload photo."));
      return;
    }
    const updateResult = await updateProfile({ avatar_url: result.url });
    if (updateResult && !("error" in updateResult)) {
      setProfile((prev) => (prev ? { ...prev, avatar_url: result.url } : { ...profile!, avatar_url: result.url }));
      toast.success(t("Profile photo updated!"));
    } else {
      toast.error(t("Photo uploaded but failed to save to profile."));
    }
  };

  const handleRemoveAvatar = async () => {
    const updateResult = await updateProfile({ avatar_url: null });
    if (updateResult && !("error" in updateResult)) {
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
      toast.success(t("Profile photo removed."));
    } else {
      toast.error(t("Failed to remove photo."));
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <Preloader />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-3 md:space-y-4 pb-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">{t("My Profile")}</h1>
          <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">{t("Your personal and emergency contact information.")}</p>
        </div>

        {/* Profile Image */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 md:p-5 shadow-sm">
          <h3 className="font-display text-base md:text-lg font-semibold text-foreground mb-3">{t("Profile Photo")}</h3>
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-2 border-primary/20 shadow-md">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={t("Profile")} />}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl md:text-2xl">
                <User className="h-12 w-12 md:h-14 md:w-14" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <Button
                type="button"
                variant="default"
                className="w-full min-h-[44px] rounded-lg text-sm"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {uploadingAvatar ? t("Uploading…") : profile?.avatar_url ? t("Change photo") : t("Add photo")}
              </Button>
              {profile?.avatar_url && (
                <Button type="button" variant="outline" className="w-full min-h-[40px] rounded-lg text-sm" onClick={handleRemoveAvatar}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {t("Remove photo")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <User className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <h3 className="font-display text-base md:text-lg font-semibold text-foreground">{t("Personal Information")}</h3>
            </div>
            {!editingPersonal && (
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg" onClick={() => setEditingPersonal(true)} aria-label={t("Edit personal information")}>
                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            )}
          </div>

          {editingPersonal ? (
            <form onSubmit={handleSavePersonal} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">{t("Full Name")}</Label>
                  <Input id="fullName" value={personalForm.full_name ?? ""} onChange={(e) => setPersonalForm((p) => ({ ...p, full_name: e.target.value }))} placeholder={t("Full name")} />
                </div>
                <div>
                  <Label htmlFor="gender">{t("Gender")}</Label>
                  <select id="gender" value={personalForm.gender ?? ""} onChange={(e) => setPersonalForm((p) => ({ ...p, gender: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">{t("Select")}</option>
                    <option>{t("Male")}</option>
                    <option>{t("Female")}</option>
                    <option>{t("Other")}</option>
                    <option>{t("Prefer not to say")}</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dob">{t("Date of Birth")}</Label>
                  <Input id="dob" type="date" value={personalForm.date_of_birth ?? ""} onChange={(e) => setPersonalForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="bloodGroup">{t("Blood Group")}</Label>
                  <select id="bloodGroup" value={personalForm.blood_group ?? ""} onChange={(e) => setPersonalForm((p) => ({ ...p, blood_group: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">{t("Select")}</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">{t("Phone Number")}</Label>
                  <Input id="phone" value={personalForm.phone ?? ""} onChange={(e) => setPersonalForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 ..." />
                </div>
                <div>
                  <Label htmlFor="email">{t("Email (optional)")}</Label>
                  <Input id="email" type="email" value={personalForm.email ?? ""} onChange={(e) => setPersonalForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">{t("Address")}</Label>
                <Input id="address" value={personalForm.address ?? ""} onChange={(e) => setPersonalForm((p) => ({ ...p, address: e.target.value }))} placeholder={t("Address")} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 min-h-[44px] rounded-lg text-sm" disabled={savingPersonal}>{savingPersonal ? t("Saving…") : t("Save")}</Button>
                <Button type="button" variant="outline" className="flex-1 min-h-[44px] rounded-lg text-sm" onClick={handleCancelPersonal}>{t("Cancel")}</Button>
              </div>
            </form>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-muted-foreground">{t("Full Name")}</dt><dd className="font-medium text-foreground">{profile?.full_name || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Gender")}</dt><dd className="font-medium text-foreground">{profile?.gender || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Date of Birth")}</dt><dd className="font-medium text-foreground">{formatDate(profile?.date_of_birth ?? undefined)}</dd></div>
              <div><dt className="text-muted-foreground">{t("Blood Group")}</dt><dd className="font-medium text-foreground">{profile?.blood_group || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Phone")}</dt><dd className="font-medium text-foreground">{profile?.phone || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Email")}</dt><dd className="font-medium text-foreground">{profile?.email || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Address")}</dt><dd className="font-medium text-foreground">{profile?.address || "—"}</dd></div>
            </dl>
          )}
        </div>

        {/* BP & Weight */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <h3 className="font-display text-base md:text-lg font-semibold text-foreground">{t("BP & Weight")}</h3>
            </div>
            {!editingVitals && (
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg" onClick={() => setEditingVitals(true)} aria-label={t("Edit BP and weight")}>
                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            )}
          </div>

          {editingVitals ? (
            <form onSubmit={handleSaveVitals} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="bloodPressure">{t("Blood Pressure")}</Label>
                  <Input id="bloodPressure" value={vitalsForm.blood_pressure ?? ""} onChange={(e) => setVitalsForm((p) => ({ ...p, blood_pressure: e.target.value }))} placeholder="e.g. 120/80" />
                </div>
                <div>
                  <Label htmlFor="weight">{t("Weight (kg)")}</Label>
                  <Input id="weight" type="number" min={1} max={500} step={0.1} value={vitalsForm.weight ?? ""} onChange={(e) => setVitalsForm((p) => ({ ...p, weight: e.target.value }))} placeholder="e.g. 70" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 min-h-[44px] rounded-lg text-sm" disabled={savingVitals}>{savingVitals ? t("Saving…") : t("Save")}</Button>
                <Button type="button" variant="outline" className="flex-1 min-h-[44px] rounded-lg text-sm" onClick={handleCancelVitals}>{t("Cancel")}</Button>
              </div>
            </form>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-muted-foreground">{t("Blood Pressure")}</dt><dd className="font-medium text-foreground">{profile?.blood_pressure || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Weight")}</dt><dd className="font-medium text-foreground">{profile?.weight != null ? `${profile.weight} kg` : "—"}</dd></div>
            </dl>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Phone className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <h3 className="font-display text-base md:text-lg font-semibold text-foreground">{t("Emergency Contact")}</h3>
            </div>
            {!editingEmergency && (
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg" onClick={() => setEditingEmergency(true)} aria-label={t("Edit emergency contact")}>
                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            )}
          </div>

          {editingEmergency ? (
            <form onSubmit={handleSaveEmergency} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="emergencyName">{t("Contact Name")}</Label>
                  <Input id="emergencyName" value={emergencyForm.emergency_contact_name ?? ""} onChange={(e) => setEmergencyForm((p) => ({ ...p, emergency_contact_name: e.target.value }))} placeholder={t("Full name")} />
                </div>
                <div>
                  <Label htmlFor="emergencyRelation">{t("Relation")}</Label>
                  <Input id="emergencyRelation" value={emergencyForm.emergency_contact_relation ?? ""} onChange={(e) => setEmergencyForm((p) => ({ ...p, emergency_contact_relation: e.target.value }))} placeholder={t("e.g. Father, Spouse")} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="emergencyPhone">{t("Phone Number")}</Label>
                  <Input id="emergencyPhone" value={emergencyForm.emergency_contact_phone ?? ""} onChange={(e) => setEmergencyForm((p) => ({ ...p, emergency_contact_phone: e.target.value }))} placeholder="+91 ..." />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 min-h-[44px] rounded-lg text-sm" disabled={savingEmergency}>{savingEmergency ? t("Saving…") : t("Save")}</Button>
                <Button type="button" variant="outline" className="flex-1 min-h-[44px] rounded-lg text-sm" onClick={handleCancelEmergency}>{t("Cancel")}</Button>
              </div>
            </form>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-muted-foreground">{t("Name")}</dt><dd className="font-medium text-foreground">{profile?.emergency_contact_name || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Relation")}</dt><dd className="font-medium text-foreground">{profile?.emergency_contact_relation || "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("Phone")}</dt><dd className="font-medium text-foreground">{profile?.emergency_contact_phone || "—"}</dd></div>
            </dl>
          )}
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientMyProfile;
