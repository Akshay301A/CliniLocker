import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, CreditCard, Loader2, ShieldCheck, ShieldEllipsis, Smartphone, Siren, Upload, UserRound, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Preloader } from "@/components/Preloader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import HealthCardDisplay from "@/components/patient/HealthCardDisplay";
import {
  completeFounding500Validation,
  createFounding500Order,
  ensureHealthCardExists,
  getFounding500State,
  markEmergencyQrGenerated,
  markEmergencyQrSaved,
  sendFounding500Otp,
  syncFounding500Order,
  startFounding500Validation,
  updateProfile,
  verifyFounding500Otp,
  type EmergencyCampaignState,
  type Founding500ShippingAddress,
} from "@/lib/api";
import type { HealthCardRow } from "@/lib/supabase";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: "_modal" | "_self" | "_blank" | "_top" }) => Promise<unknown>;
    };
  }
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

async function loadCashfreeSdk() {
  if (window.Cashfree) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Cashfree SDK.")), { once: true });
      if (window.Cashfree) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK."));
    document.body.appendChild(script);
  });
}

const emptyShipping: Founding500ShippingAddress = {
  shipping_name: "",
  shipping_phone: "",
  shipping_line1: "",
  shipping_line2: "",
  shipping_city: "",
  shipping_state: "",
  shipping_pincode: "",
  shipping_country: "India",
};

export default function EmergencyIdentity() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<EmergencyCampaignState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [profileForm, setProfileForm] = useState({
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_phone: "",
    allergies: "",
    medical_conditions: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [card, setCard] = useState<HealthCardRow | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationSecondsLeft, setValidationSecondsLeft] = useState(60);
  const [validationSubmitting, setValidationSubmitting] = useState(false);
  const [shipping, setShipping] = useState<Founding500ShippingAddress>(emptyShipping);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const refreshState = async () => {
    const next = await getFounding500State();
    setState(next);
    setPhone(next.profile?.phone ?? "");
    setProfileForm({
      blood_group: next.profile?.blood_group ?? "",
      emergency_contact_name: next.profile?.emergency_contact_name ?? "",
      emergency_contact_relation: next.profile?.emergency_contact_relation ?? "",
      emergency_contact_phone: next.profile?.emergency_contact_phone ?? "",
      allergies: next.profile?.allergies ?? "",
      medical_conditions: next.profile?.medical_conditions ?? "",
    });
    setShipping((prev) => ({
      ...prev,
      shipping_name: prev.shipping_name || next.profile?.full_name || "",
      shipping_phone: prev.shipping_phone || next.profile?.phone || "",
    }));
  };

  useEffect(() => {
    let mounted = true;
    refreshState()
      .catch((error) => {
        if (mounted) {
          const message = error instanceof Error ? error.message : "Unable to load Emergency Identity rollout.";
          setLoadError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const returnedOrderId = searchParams.get("cf_order_id");
    const pendingStatus = String(state?.latestOrder?.status ?? "");
    if (!returnedOrderId || !state?.latestOrder?.id || pendingStatus !== "awaiting_payment") return;
    syncFounding500Order(String(state.latestOrder.id))
      .then(() => refreshState())
      .catch(() => undefined);
  }, [searchParams, state?.latestOrder?.id, state?.latestOrder?.status]);

  useEffect(() => {
    if (!validationOpen || !state) return;
    setValidationSecondsLeft(state.campaign.validation_seconds ?? 60);
  }, [validationOpen, state]);

  useEffect(() => {
    if (!validationOpen || validationSubmitting) return;
    if (validationSecondsLeft <= 0) {
      setValidationSubmitting(true);
      completeFounding500Validation()
        .then(async (result) => {
          await refreshState();
          setValidationOpen(false);
          toast.success(
            result.status === "approved"
              ? `Emergency Identity activated${result.foundingMemberId ? ` • ${result.foundingMemberId}` : ""}`
              : "Founding500 free allocation has closed. Launch Offer is now active.",
          );
        })
        .catch((error) => toast.error(error instanceof Error ? error.message : "Secure validation failed."))
        .finally(() => setValidationSubmitting(false));
      return;
    }
    const timer = window.setTimeout(() => setValidationSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [validationOpen, validationSecondsLeft, validationSubmitting, state]);

  const validationMessage = useMemo(() => {
    if (!state) return "Securing Medical Identity";
    const messages = state.validationMessages?.length ? state.validationMessages : ["Securing Medical Identity"];
    const total = state.campaign.validation_seconds || 60;
    const elapsed = total - validationSecondsLeft;
    const index = Math.min(messages.length - 1, Math.floor((elapsed / total) * messages.length));
    return messages[index];
  }, [state, validationSecondsLeft]);

  if (loading) {
    return (
      <PatientLayout>
        <Preloader />
      </PatientLayout>
    );
  }

  if (!state) {
    return (
      <PatientLayout>
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Founding500 Emergency Identity Rollout
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-slate-950">
              Emergency Identity activation is not available yet.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              {loadError || "The rollout configuration could not be loaded from the backend yet."}
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Check that the latest web deploy is live and the `founding500-hub` Supabase function is deployed with its secrets.
            </div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  const approved = state.activation?.eligibility_status === "approved";
  const launchOfferOnly = state.activation?.eligibility_status === "launch_offer" || state.campaignClosed;
  const canValidate = state.steps.every((step) => step.completed);
  const latestOrderStatus = String(state.latestOrder?.status ?? "");

  const openEmergencyCard = async () => {
    setCardOpen(true);
    setCardLoading(true);
    try {
      const ensured = await ensureHealthCardExists(state.profile);
      if (!ensured) throw new Error("Unable to prepare Emergency QR.");
      await markEmergencyQrGenerated();
      setCard(ensured);
      await refreshState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open Emergency QR.");
      setCardOpen(false);
    } finally {
      setCardLoading(false);
    }
  };

  const saveEmergencyProfile = async () => {
    setSavingProfile(true);
    const result = await updateProfile({
      blood_group: profileForm.blood_group,
      emergency_contact_name: profileForm.emergency_contact_name,
      emergency_contact_relation: profileForm.emergency_contact_relation,
      emergency_contact_phone: profileForm.emergency_contact_phone,
      allergies: profileForm.allergies || null,
      medical_conditions: profileForm.medical_conditions || null,
    });
    setSavingProfile(false);
    if (result && "error" in result) {
      toast.error(result.error || "Unable to save emergency profile.");
      return;
    }
    await refreshState();
    toast.success("Emergency profile secured.");
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const result = await sendFounding500Otp(phone);
      if (!result.ok) throw new Error(result.error || "OTP delivery is unavailable.");
      toast.success("Emergency verification code sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      await verifyFounding500Otp(phone, otp);
      setOtp("");
      await refreshState();
      toast.success("Phone number secured.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOrder = async () => {
    setCreatingOrder(true);
    try {
      const created = await createFounding500Order(shipping);
      await refreshState();
      if (created.checkoutMode === "internal") {
        toast.success("Emergency kit order secured.");
        return;
      }

      if (!created.paymentSessionId) throw new Error("Cashfree payment session missing.");

      await loadCashfreeSdk();
      const cashfree = window.Cashfree?.({
        mode: import.meta.env.PROD ? "production" : "sandbox",
      });
      if (!cashfree) throw new Error("Cashfree SDK not available.");
      await cashfree.checkout({
        paymentSessionId: created.paymentSessionId,
        redirectTarget: "_modal",
      });

      const orderId = String(created.order.id ?? "");
      if (orderId) {
        await syncFounding500Order(orderId);
        await refreshState();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start secure checkout.");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <PatientLayout>
      <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,_#081225_0%,_#102342_40%,_#16385f_100%)] p-6 text-white shadow-[0_30px_70px_rgba(8,18,37,0.22)] md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
                Founding500 Emergency Identity Rollout
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">
                Activate a secure Emergency Medical Identity before public rollout.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                Complete your emergency activation steps, secure your medical history, and unlock priority access to the
                Founding500 Emergency Kit.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[520px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">Kits Remaining</p>
                <p className="mt-3 text-3xl font-semibold">{state.counts.kitsRemaining}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">Kits Claimed</p>
                <p className="mt-3 text-3xl font-semibold">{state.counts.kitsClaimed}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">Activation Progress</p>
                <p className="mt-3 text-3xl font-semibold">{state.progressPercent}%</p>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-50">{state.completedSteps} of {state.steps.length} Emergency Identity steps completed</p>
                <p className="mt-1 text-sm text-slate-200/90">
                  {approved
                    ? `Emergency Identity secured${state.activation?.founding_member_id ? ` • ${state.activation.founding_member_id}` : ""}`
                    : launchOfferOnly
                      ? "Founding500 free allocation has closed. Launch Offer is active."
                      : "Activation remains identity-driven and medically serious until secure validation completes."}
                </p>
              </div>
              <div className="w-full max-w-md">
                <Progress value={state.progressPercent} className="h-3 bg-white/15 [&>div]:bg-cyan-300" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Activation Checklist</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Emergency Identity steps</h2>
              </div>
              {approved ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Activated
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">
                  <ShieldEllipsis className="h-4 w-4" />
                  In progress
                </div>
              )}
            </div>

            <div className="space-y-3">
              {state.steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`rounded-[24px] border p-4 transition ${
                    step.completed ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                        step.completed ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {step.completed ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900">{step.title}</h3>
                        {step.meta && <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{step.meta}</span>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <Siren className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Eligibility Under Secure Validation</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Activation does not unlock instantly. CliniLocker performs a timed secure validation to finalize
                    emergency identity access and founding availability.
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 h-11 rounded-2xl px-5"
                disabled={!canValidate || approved || validationSubmitting}
                onClick={async () => {
                  try {
                    await startFounding500Validation();
                    await refreshState();
                    setValidationOpen(true);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to start secure validation.");
                  }
                }}
              >
                {approved ? "Emergency Identity already activated" : "Begin secure validation"}
              </Button>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Step 1</p>
                  <h2 className="font-display text-xl font-semibold text-slate-900">Verify phone number</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                <Button variant="outline" disabled={sendingOtp} onClick={handleSendOtp}>
                  {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </Button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" />
                <Button disabled={verifyingOtp} onClick={handleVerifyOtp}>
                  {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Step 3</p>
                  <h2 className="font-display text-xl font-semibold text-slate-900">Emergency profile</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Blood group</Label>
                  <select
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profileForm.blood_group}
                    onChange={(e) => setProfileForm((current) => ({ ...current, blood_group: e.target.value }))}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Emergency contact name</Label>
                  <Input
                    className="mt-2"
                    value={profileForm.emergency_contact_name}
                    onChange={(e) => setProfileForm((current) => ({ ...current, emergency_contact_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Emergency contact phone</Label>
                  <Input
                    className="mt-2"
                    value={profileForm.emergency_contact_phone}
                    onChange={(e) => setProfileForm((current) => ({ ...current, emergency_contact_phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input
                    className="mt-2"
                    value={profileForm.emergency_contact_relation}
                    onChange={(e) => setProfileForm((current) => ({ ...current, emergency_contact_relation: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Allergies or sensitivities (optional)</Label>
                  <textarea
                    className="mt-2 min-h-[84px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profileForm.allergies}
                    onChange={(e) => setProfileForm((current) => ({ ...current, allergies: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Existing conditions (optional)</Label>
                  <textarea
                    className="mt-2 min-h-[84px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profileForm.medical_conditions}
                    onChange={(e) => setProfileForm((current) => ({ ...current, medical_conditions: e.target.value }))}
                  />
                </div>
              </div>
              <Button className="mt-4" disabled={savingProfile} onClick={saveEmergencyProfile}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Secure emergency profile"}
              </Button>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Steps 4 & 5</p>
                  <h2 className="font-display text-xl font-semibold text-slate-900">Emergency QR activation</h2>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-2xl" onClick={openEmergencyCard}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Generate Emergency QR
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={async () => {
                  await markEmergencyQrSaved();
                  await refreshState();
                  toast.success("Emergency QR marked as saved.");
                }}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  I have saved the QR
                </Button>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Founding500 Access</p>
                  <h2 className="font-display text-xl font-semibold text-slate-900">
                    {approved ? "Order the physical emergency kit" : launchOfferOnly ? "Launch Offer pricing active" : "Activation unlocks secure ordering"}
                  </h2>
                </div>
              </div>
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-sm text-slate-400 line-through">₹{state.pricing.originalPrice}</span>
                  <span className="text-3xl font-semibold text-slate-900">₹{state.pricing.discountedPrice}</span>
                  {state.pricing.shippingPrice > 0 && (
                    <span className="text-sm text-slate-500">+ ₹{state.pricing.shippingPrice} shipping</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {approved
                    ? "Your Founding500 access is secured. Checkout remains identity-verified and one-time."
                    : launchOfferOnly
                      ? "The public launch offer is active. Complimentary allocation has closed."
                      : "Ordering unlocks after secure activation completes."}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Recipient name</Label>
                  <Input className="mt-2" value={shipping.shipping_name} onChange={(e) => setShipping((current) => ({ ...current, shipping_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-2" value={shipping.shipping_phone} onChange={(e) => setShipping((current) => ({ ...current, shipping_phone: e.target.value }))} />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input className="mt-2" value={shipping.shipping_pincode} onChange={(e) => setShipping((current) => ({ ...current, shipping_pincode: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address line 1</Label>
                  <Input className="mt-2" value={shipping.shipping_line1} onChange={(e) => setShipping((current) => ({ ...current, shipping_line1: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address line 2</Label>
                  <Input className="mt-2" value={shipping.shipping_line2 || ""} onChange={(e) => setShipping((current) => ({ ...current, shipping_line2: e.target.value }))} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input className="mt-2" value={shipping.shipping_city} onChange={(e) => setShipping((current) => ({ ...current, shipping_city: e.target.value }))} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input className="mt-2" value={shipping.shipping_state} onChange={(e) => setShipping((current) => ({ ...current, shipping_state: e.target.value }))} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  className="h-11 rounded-2xl px-5"
                  disabled={creatingOrder || (!approved && !launchOfferOnly)}
                  onClick={handleOrder}
                >
                  {creatingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : "Secure order"}
                </Button>

                {latestOrderStatus === "awaiting_payment" && state.latestOrder?.id && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl px-5"
                    onClick={async () => {
                      try {
                        await syncFounding500Order(String(state.latestOrder?.id ?? ""));
                        await refreshState();
                        toast.success("Payment status refreshed.");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Unable to refresh payment.");
                      }
                    }}
                  >
                    Refresh payment status
                  </Button>
                )}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Step 2</p>
              <h2 className="font-display text-xl font-semibold text-slate-900">Secure medical history</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Emergency Identity activation requires two securely validated medical records in PDF, JPG, or PNG format.
            The validation logic remains private to preserve integrity.
          </p>
          <Button asChild className="mt-4 rounded-2xl">
            <a href="/patient/upload">
              Upload medical records
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </section>
      </div>

      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emergency QR profile</DialogTitle>
            <DialogDescription>
              Save this identity card to your device so it is available during emergency situations.
            </DialogDescription>
          </DialogHeader>
          {cardLoading && (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing secure Emergency QR…
            </div>
          )}
          {!cardLoading && card && <HealthCardDisplay card={card} containerRef={cardRef} />}
        </DialogContent>
      </Dialog>

      <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-[28px] border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-0">
          <div className="border-b border-slate-200 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-slate-950">Eligibility Under Secure Validation</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-slate-600">
                Your emergency medical identity is being finalized with a secure activation sequence.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-5 px-6 py-6">
            <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/70 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Current state</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{validationMessage}</p>
              <p className="mt-2 text-sm text-slate-600">Please keep this screen open while secure activation completes.</p>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                <span>Secure activation progress</span>
                <span>{validationSecondsLeft}s</span>
              </div>
              <Progress
                value={((state.campaign.validation_seconds - validationSecondsLeft) / state.campaign.validation_seconds) * 100}
                className="h-3 bg-slate-100 [&>div]:bg-[linear-gradient(90deg,_#0ea5e9_0%,_#1d4ed8_100%)]"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed bottom-5 right-5 z-40 hidden lg:block">
        <div className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-500 shadow-xl backdrop-blur">
          Emergency rollout
        </div>
      </div>
    </PatientLayout>
  );
}
