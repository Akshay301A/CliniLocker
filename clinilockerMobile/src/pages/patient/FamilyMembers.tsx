import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Phone, Calendar, Trash2, Copy, Link2, Inbox, Send } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    toast.success(t("Invite created. Send the link to ") + name.trim() + t(" so they can create an account."));
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
    toast.success(t("Invite link copied! Send it to ") + member.name + t(" via WhatsApp or SMS."));
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
      <div className="animate-fade-in space-y-3 md:space-y-4 pb-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">{t("Family Members")}</h1>
            <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">{t("Manage health records for your loved ones.")}</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="w-full md:w-auto min-h-[44px] rounded-lg text-sm">
            <Plus className="mr-2 h-4 w-4" /> {t("Add Member")}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("Everyone must have an account. Add a family member and send them an invite link to sign up.")}
        </p>

        {/* Tabs: Invites you received | Invites you sent – colorful card-style tabs like dashboard */}
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="w-full grid grid-cols-2 gap-3 p-0 h-auto min-h-0 bg-transparent border-0 shadow-none">
            <TabsTrigger
              value="received"
              className="flex items-center gap-3 rounded-2xl min-h-[52px] px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border border-blue-200/60 dark:border-blue-800/60 shadow-md text-blue-700 dark:text-blue-300 data-[state=active]:from-blue-100 data-[state=active]:to-blue-200 dark:data-[state=active]:from-blue-900/70 dark:data-[state=active]:to-blue-800/70 data-[state=active]:border-blue-300/80 dark:data-[state=active]:border-blue-600 data-[state=active]:shadow-lg data-[state=inactive]:opacity-90"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <Inbox className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-semibold">{t("Invites you received")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="flex items-center gap-3 rounded-2xl min-h-[52px] px-4 py-3 bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/50 dark:to-purple-900/50 border border-violet-200/60 dark:border-violet-800/60 shadow-md text-violet-700 dark:text-violet-300 data-[state=active]:from-violet-100 data-[state=active]:to-violet-200 dark:data-[state=active]:from-violet-900/70 dark:data-[state=active]:to-violet-800/70 data-[state=active]:border-violet-300/80 dark:data-[state=active]:border-violet-600 data-[state=active]:shadow-lg data-[state=inactive]:opacity-90"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md">
                <Send className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-semibold">{t("Invites you sent")}</span>
            </TabsTrigger>
          </TabsList>
          <div className="mt-3 rounded-2xl border border-border/60 bg-card p-4 md:p-5 shadow-md min-h-[120px]">
            <TabsContent value="received" className="mt-0">
              {members.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">{t("No family members added yet.")}</p>
                </div>
              ) : receivedInvites.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("If someone added you as a family member, you'll see it here. Accept to link accounts and see shared reports.")}
                  </p>
                  {receivedInvites.map((inv) => (
                    <div
                      key={inv.token}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm md:text-base font-semibold text-foreground">
                          {inv.inviter_name} {t("invited you")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">({inv.member_label})</p>
                      </div>
                      <Button
                        className="w-full md:w-auto min-h-[40px] rounded-lg text-sm"
                        onClick={() => handleAcceptReceived(inv.token)}
                        disabled={acceptingToken === inv.token}
                      >
                        {acceptingToken === inv.token ? t("Accepting…") : t("Accept")}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">{t("No pending invites right now.")}</p>
              )}
            </TabsContent>
            <TabsContent value="sent" className="mt-0">
              {members.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">{t("No family members added yet.")}</p>
                </div>
              ) : pendingSent.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("Pending invites you've sent. Copy the link again to resend. They can accept from the link or under \"Invites you received\" on their Family Members page.")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pendingSent.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-col md:flex-row items-start md:items-center gap-2.5 rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <span className="text-xs md:text-sm font-semibold text-foreground flex-1">{m.name}</span>
                        <Button
                          type="button"
                          variant="default"
                          className="w-full md:w-auto min-h-[40px] rounded-lg text-sm"
                          onClick={() => handleCopyInviteLink(m)}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> {t("Copy link")}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">{t("No pending invites. Add a member to send an invite.")}</p>
              )}
            </TabsContent>
          </div>
        </Tabs>
        {inviteLink && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Link2 className="h-4 w-4 text-primary" />
              {t("Invite link for ") + inviteLink.name}
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
          <form onSubmit={handleAdd} className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm space-y-3">
            <h3 className="font-display text-base md:text-lg font-semibold text-foreground">{t("Invite Family Member")}</h3>
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
              <Button type="submit" className="flex-1 min-h-[44px] rounded-lg text-sm" disabled={submitting}>{submitting ? t("Creating invite…") : t("Create invite")}</Button>
              <Button type="button" variant="outline" className="flex-1 min-h-[44px] rounded-lg text-sm" onClick={() => setShowForm(false)}>{t("Cancel")}</Button>
            </div>
          </form>
        )}

        {loading ? (
          <Preloader />
        ) : (
          <>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {members.map((m) => (
                <div key={m.id} className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-3 md:p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-10 w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-display font-bold text-base md:text-lg shadow-sm">
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
          </>
        )}
      </div>
    </PatientLayout>
  );
};

export default PatientFamilyMembers;