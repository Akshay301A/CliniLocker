import { useState, useEffect } from "react";
import { Users, Plus, FileText, Phone, Calendar, Trash2 } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getFamilyMembers, insertFamilyMember, deleteFamilyMember } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { FamilyMember } from "@/lib/supabase";

const PatientFamilyMembers = () => {
  const { t } = useLanguage();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Father");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getFamilyMembers().then((data) => {
      if (mounted) setMembers(data);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("Please enter name."));
      return;
    }
    setSubmitting(true);
    const result = await insertFamilyMember({
      name: name.trim(),
      relation,
      phone: phone.trim() || null,
      date_of_birth: dob || null,
    });
    setSubmitting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setMembers((prev) => [...prev, { id: result.id, user_id: "", name: name.trim(), relation, phone: phone.trim() || null, date_of_birth: dob || null }]);
    setShowForm(false);
    setName("");
    setPhone("");
    setDob("");
    toast.success(t("Family member added!"));
    getFamilyMembers().then(setMembers);
  };

  const handleRemove = async (id: string) => {
    const { error } = await deleteFamilyMember(id);
    if (error) {
      toast.error(error);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success(t("Family member removed."));
  };

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("Family Members")}</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">{t("Manage health records for your loved ones.")}</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto min-h-[44px]">
            <Plus className="mr-2 h-4 w-4" /> {t("Add Member")}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Add Family Member")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="memberName">{t("Full Name")}</Label>
                <Input id="memberName" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Enter name")} required />
              </div>
              <div>
                <Label htmlFor="relation">{t("Relation")}</Label>
                <select id="relation" value={relation} onChange={(e) => setRelation(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Spouse</option>
                  <option>Child</option>
                  <option>Sibling</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="memberPhone">{t("Phone Number")}</Label>
                <Input id="memberPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
              </div>
              <div>
                <Label htmlFor="memberDob">{t("Date of Birth")}</Label>
                <Input id="memberDob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? t("Adding…") : t("Add Member")}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t("Cancel")}</Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => (
                <div key={m.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-hover">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold text-base sm:text-lg">
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">{m.name}</h3>
                        <Badge variant="secondary" className="mt-0.5">{t(m.relation)}</Badge>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemove(m.id)} className="touch-target flex shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {m.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" /> {m.phone}
                      </div>
                    )}
                    {m.date_of_birth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" /> {m.date_of_birth}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div className="rounded-xl border border-dashed border-border py-12 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">{t("No family members added yet.")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </PatientLayout>
  );
};

export default PatientFamilyMembers;
