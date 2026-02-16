import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Phone, Calendar, Trash2, Copy, Link2, Inbox, Send } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getFamilyMembers,
  insertFamilyMember,
  deleteFamilyMember,
  createFamilyInvite,
  getPendingInvitesReceived,
  acceptFamilyInvite,
} from "@/lib/api";
import type { PendingInviteReceived } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Preloader } from "@/components/Preloader";
import type { FamilyMember } from "@/lib/supabase";

const PatientFamilyMembers = () => {
  const { t } = useLanguage();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<PendingInviteReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Father");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<{ name: string; link: string } | null>(null);

  const loadData = useCallback(() => {
    getFamilyMembers().then(setMembers);
    getPendingInvitesReceived().then(setReceivedInvites);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([getFamilyMembers(), getPendingInvitesReceived()]).then(([m, r]) => {
      if (mounted) {
        setMembers(m);
        setReceivedInvites(r);
      }
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
    const phoneTrim = phone.trim();
    if (!phoneTrim) {
      toast.error(t("Phone number is required. Family members must create an account."));
      return;
    }
    setSubmitting(true);
    const result = await insertFamilyMember({
      name: name.trim(),
      relation,
      phone: phoneTrim,
      date_of_birth: dob || null,
    });
    if ("error" in result) {
      setSubmitting(false);
      toast.error(result.error);
      return;
    }
    const inviteResult = await createFamilyInvite(result.id);
    setSubmitting(false);
    if ("error" in inviteResult) {
      toast.error(inviteResult.error);
      getFamilyMembers().then(setMembers);
      return;
    }
    setInviteLink({ name: name.trim(), link: inviteResult.link });
    setShowForm(false);
    setName("");
    setPhone("");
    setDob("");
    toast.success(t("Invite created. Send the link to {{name}} so they can create an account.", { name: name.trim() }));
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

  const handleCopyInviteLink = async (member: FamilyMember) => {
    const result = await createFamilyInvite(member.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    await navigator.clipboard.writeText(result.link);
    toast.success(t("Invite link copied! Send it to {{name}} via WhatsApp or SMS.", { name: member.name }));
  };

  const handleAcceptReceived = async (token: string) => {
    setAcceptingToken(token);
    const result = await acceptFamilyInvite(token);
    setAcceptingToken(null);
    if (result.ok) {
      toast.success(t("You're now linked. They'll appear in your family list."));
      loadData();
    } else {
      toast.error(result.error ?? t("Invalid or expired invite."));
      loadData();
    }
  };

  const pendingSent = members.filter((m) => !m.linked_user_id);

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

        <p className="text-sm text-muted-foreground">
          {t("Everyone must have an account. Add a family member and send them an invite link to sign up.")}
        </p>

        {receivedInvites.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
            <h2 className="flex items-center gap-2 font-display font-semibold text-foreground">
              <Inbox className="h-4 w-4 text-primary" /> {t("Invites you received")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("Someone added you as a family member. Accept to link accounts and see shared reports.")}
            </p>
            <div className="space-y-2">
              {receivedInvites.map((inv) => (
                <div
                  key={inv.token}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {inv.inviter_name} {t("invited you")} ({inv.member_label})
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptReceived(inv.token)}
                      disabled={acceptingToken === inv.token}
                    >
                      {acceptingToken === inv.token ? t("Accepting…") : t("Accept")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingSent.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <h2 className="flex items-center gap-2 font-display font-semibold text-foreground">
              <Send className="h-4 w-4 text-muted-foreground" /> {t("Invites you sent")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("Copy the invite link and send it to them. They can accept from the link or from their Family Members page.")}
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingSent.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => handleCopyInviteLink(m)}
                  >
                    <Copy className="h-3 w-3" /> {t("Copy link")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {inviteLink && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Link2 className="h-4 w-4 text-primary" />
              {t("Invite link for {{name}}", { name: inviteLink.name })}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Send this link so they can create an account. The link expires in 7 days.")}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Input readOnly value={inviteLink.link} className="font-mono text-xs flex-1 min-w-0" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteLink.link);
                  toast.success(t("Link copied!"));
                }}
              >
                <Copy className="h-3.5 w-3.5" /> {t("Copy")}
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setInviteLink(null)}>
              {t("Done")}
            </Button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAdd} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">{t("Invite Family Member")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("They will need to create a CliniLocker account using the invite link.")}
            </p>
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
                <Label htmlFor="memberPhone">{t("Phone Number")} *</Label>
                <Input id="memberPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." required />
              </div>
              <div>
                <Label htmlFor="memberDob">{t("Date of Birth")}</Label>
                <Input id="memberDob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? t("Creating invite…") : t("Create invite")}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t("Cancel")}</Button>
            </div>
          </form>
        )}

        {loading ? (
          <Preloader />
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
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          <Badge variant="secondary">{t(m.relation)}</Badge>
                          {m.linked_user_id ? (
                            <Badge variant="outline" className="text-green-600 border-green-600/30">{t("Has account")}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600/30">{t("Invite pending")}</Badge>
                          )}
                        </div>
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
                  {!m.linked_user_id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full gap-2"
                      onClick={() => handleCopyInviteLink(m)}
                    >
                      <Link2 className="h-3.5 w-3.5" /> {t("Copy invite link")}
                    </Button>
                  )}
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
