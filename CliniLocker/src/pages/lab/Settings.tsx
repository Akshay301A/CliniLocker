import { useState, useEffect } from "react";
import { LabLayout } from "@/components/LabLayout";
import { Preloader } from "@/components/Preloader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getLab, updateLab } from "@/lib/api";

const LabSettings = () => {
  const { labId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", license_number: "" });

  useEffect(() => {
    if (!labId) return;
    getLab(labId).then((lab) => {
      if (lab) setForm({
        name: lab.name ?? "",
        email: lab.email ?? "",
        phone: lab.phone ?? "",
        address: lab.address ?? "",
        license_number: lab.license_number ?? "",
      });
      setLoading(false);
    });
  }, [labId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId) return;
    setSaving(true);
    const updated = await updateLab(labId, {
      name: form.name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      license_number: form.license_number || undefined,
    });
    setSaving(false);
    if (updated) toast.success("Settings saved");
    else toast.error("Failed to save settings");
  };

  if (loading) {
    return (
      <LabLayout>
        <Preloader />
      </LabLayout>
    );
  }

  return (
    <LabLayout>
      <div className="mx-auto max-w-2xl w-full animate-fade-in">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage your lab profile and preferences.</p>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold text-foreground">Lab Profile</h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="labName">Lab Name</Label>
                <Input id="labName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lab name" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="lab@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
              </div>
              <div>
                <Label htmlFor="license">License Number</Label>
                <Input id="license" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} placeholder="License number" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold text-foreground">Change Password</h3>
            <p className="mt-2 text-sm text-muted-foreground">Change your password from your Supabase Auth / account provider (e.g. Google).</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold text-foreground">Plan Details</h3>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Current Plan</p>
                <p className="text-sm text-muted-foreground">200 reports/month included</p>
              </div>
              <Badge>Free</Badge>
            </div>
            <Separator className="my-4" />
            <Button type="button" variant="outline" size="sm">Upgrade to Pro</Button>
          </div>

          <Button type="submit" className="w-full min-h-[44px]" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </form>
      </div>
    </LabLayout>
  );
};

export default LabSettings;
