import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileLock2,
  Loader2,
  ShieldCheck,
  ShieldEllipsis,
  Smartphone,
  Sparkles,
  Upload,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Preloader } from "@/components/Preloader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import HealthCardDisplay from "@/components/patient/HealthCardDisplay";
import {
  completeFounding500Validation,
  createFounding500Order,
  ensureHealthCardExists,
  getFounding500State,
  markEmergencyQrGenerated,
  markEmergencyQrSaved,
  sendFounding500Otp,
  startFounding500Validation,
  syncFounding500Order,
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
const STEP_ORDER = ["verify", "records", "profile", "qr", "validation", "order"] as const;
type StepKey = (typeof STEP_ORDER)[number];

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

function getStepCompletion(state: EmergencyCampaignState) {
  const byIndex = {
    verify: Boolean(state.steps[0]?.completed),
    records: Boolean(state.steps[1]?.completed),
    profile: Boolean(state.steps[2]?.completed),
    qr: Boolean(state.steps[3]?.completed && state.steps[4]?.completed),
    validation: state.activation?.eligibility_status === "approved" || state.activation?.eligibility_status === "launch_offer",
    order: ["paid", "fulfilled"].includes(String(state.latestOrder?.status ?? "")),
  };
  return byIndex;
}

function firstIncompleteStep(state: EmergencyCampaignState): StepKey {
  const completion = getStepCompletion(state);
  return STEP_ORDER.find((step) => !completion[step]) ?? "order";
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

export default function EmergencyIdentity() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<EmergencyCampaignState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<StepKey>("verify");
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
    setActiveStep((current) => (STEP_ORDER.includes(current) ? current : firstIncompleteStep(next)));
    return next;
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
    if (!validationOpen || validationSubmitting || !state) return;
    if (validationSecondsLeft <= 0) {
      setValidationSubmitting(true);
      completeFounding500Validation()
        .then(async (result) => {
          const next = await refreshState();
          setActiveStep(result.status === "approved" ? "order" : firstIncompleteStep(next));
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
  }, [state, validationOpen, validationSecondsLeft, validationSubmitting]);

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
  const completion = getStepCompletion(state);
  const canValidate = state.steps.every((step) => step.completed);
  const latestOrderStatus = String(state.latestOrder?.status ?? "");

  const stepDefs: Array<{ key: StepKey; label: string; short: string }> = [
    { key: "verify", label: "Phone verification", short: "Verify" },
    { key: "records", label: "Medical records", short: "Records" },
    { key: "profile", label: "Emergency profile", short: "Profile" },
    { key: "qr", label: "Emergency QR", short: "QR" },
    { key: "validation", label: "Secure validation", short: "Validate" },
    { key: "order", label: "Emergency kit", short: "Order" },
  ];

  const openEmergencyCard = async () => {
    setCardOpen(true);
    setCardLoading(true);
    try {
      const ensured = await ensureHealthCardExists(state.profile);
      if (!ensured) throw new Error("Unable to prepare Emergency QR.");
      await markEmergencyQrGenerated();
      setCard(ensured);
      const next = await refreshState();
      if (completion.records) setActiveStep(firstIncompleteStep(next));
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
    const next = await refreshState();
    setActiveStep(firstIncompleteStep(next));
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
      const next = await refreshState();
      setActiveStep(firstIncompleteStep(next));
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
      const next = await refreshState();
      if (created.checkoutMode === "internal") {
        setActiveStep(firstIncompleteStep(next));
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

  const heroStatus = approved
    ? `Emergency Identity secured${state.activation?.founding_member_id ? ` • ${state.activation.founding_member_id}` : ""}`
    : launchOfferOnly
      ? "Complimentary allocation closed. Launch Offer is now active."
      : `${state.completedSteps} of ${state.steps.length} Emergency Identity checkpoints completed.`;

  return (
    <PatientLayout>
      <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_34%),linear-gradient(135deg,_#f8fbff_0%,_#eef5ff_38%,_#ffffff_100%)] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                Founding500 Emergency Identity Rollout
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Activate a secure emergency medical identity, one verified step at a time.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                This rollout is designed like healthcare infrastructure, not checkout. Complete each identity checkpoint,
                validate your emergency readiness, and then unlock ordering for the physical emergency kit.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[520px]">
              <StatChip label="Kits Remaining" value={state.counts.kitsRemaining} />
              <StatChip label="Kits Claimed" value={state.counts.kitsClaimed} />
              <StatChip label="Activation Progress" value={`${state.progressPercent}%`} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr,0.6fr]">
            <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Rollout Status</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{heroStatus}</p>
                </div>
                <div className="w-full max-w-sm">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Emergency Identity progress</span>
                    <span>{state.progressPercent}%</span>
                  </div>
                  <Progress value={state.progressPercent} className="h-3 bg-slate-100 [&>div]:bg-[linear-gradient(90deg,_#0ea5e9_0%,_#2563eb_100%)]" />
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Pricing State</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-sm text-white/50 line-through">₹{state.pricing.originalPrice}</span>
                <span className="text-3xl font-semibold">₹{state.pricing.discountedPrice}</span>
                {state.pricing.shippingPrice > 0 && (
                  <span className="text-sm text-white/70">+ ₹{state.pricing.shippingPrice} shipping</span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/75">
                {approved ? "Founding500 access secured." : launchOfferOnly ? "Launch Offer active." : "Price finalizes after secure activation."}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[260px,minmax(0,1fr),340px]">
          <aside className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-8 xl:h-fit">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Activation Flow</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-slate-950">Emergency Identity</h2>
            </div>
            <div className="space-y-2">
              {stepDefs.map((step, index) => {
                const done = completion[step.key];
                const active = activeStep === step.key;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveStep(step.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-sky-200 bg-sky-50 text-slate-950"
                        : done
                          ? "border-emerald-200 bg-emerald-50/70 text-slate-900"
                          : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                        done ? "bg-emerald-600 text-white" : active ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{step.label}</p>
                      <p className="text-xs text-slate-500">{done ? "Completed" : active ? "Current step" : "Pending"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0">
            <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as StepKey)}>
              <TabsList className="mb-4 flex w-full justify-start gap-2 overflow-x-auto rounded-2xl bg-transparent p-0">
                {stepDefs.map((step) => (
                  <TabsTrigger
                    key={step.key}
                    value={step.key}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 data-[state=active]:border-sky-200 data-[state=active]:bg-sky-50 data-[state=active]:text-slate-950"
                  >
                    {step.short}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="verify" className="mt-0">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <SectionIntro
                    eyebrow="Step 1"
                    title="Verify your phone number"
                    description="Secure the communication channel attached to your emergency profile. This verification is used to protect identity activation and claim access."
                    icon={<Smartphone className="h-5 w-5" />}
                  />
                  <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,240px]">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label>Verified contact number</Label>
                      <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
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
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">
                        {completion.verify ? "Phone secured" : "Pending verification"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        WhatsApp delivery is used for OTP verification when the delivery credentials are active.
                      </p>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="records" className="mt-0">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <SectionIntro
                    eyebrow="Step 2"
                    title="Secure your medical history"
                    description="Upload two medical records in PDF, JPG, or PNG format. Validation stays private and is used to preserve integrity for emergency identity activation."
                    icon={<Upload className="h-5 w-5" />}
                  />
                  <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,240px]">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <p className="text-sm leading-7 text-slate-600">
                        Your uploads are checked for secure activation readiness. Records only count toward activation after successful validation and declaration acceptance.
                      </p>
                      <Button asChild className="mt-5 rounded-2xl">
                        <Link to="/patient/upload">
                          Upload medical records
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Progress</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-950">{state.medicalRecordsCount}/2</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {completion.records ? "Record threshold complete." : "Two validated medical records required."}
                      </p>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <SectionIntro
                    eyebrow="Step 3"
                    title="Complete the emergency profile"
                    description="Add the emergency details that matter in urgent care scenarios: blood group, emergency contact, and optional clinical context."
                    icon={<UserRound className="h-5 w-5" />}
                  />
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label>Blood group</Label>
                      <select
                        className="mt-2 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label>Emergency contact name</Label>
                      <Input className="mt-2" value={profileForm.emergency_contact_name} onChange={(e) => setProfileForm((current) => ({ ...current, emergency_contact_name: e.target.value }))} />
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label>Emergency contact phone</Label>
                      <Input className="mt-2" value={profileForm.emergency_contact_phone} onChange={(e) => setProfileForm((current) => ({ ...current, emergency_contact_phone: e.target.value }))} />
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <Label>Relationship</Label>
                      <Input className="mt-2" value={profileForm.emergency_contact_relation} onChange={(e) => setProfileForm((current) => ({ ...current, emergency_contact_relation: e.target.value }))} />
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 lg:col-span-2">
                      <Label>Allergies or sensitivities (optional)</Label>
                      <Textarea className="mt-2 min-h-[96px]" value={profileForm.allergies} onChange={(e) => setProfileForm((current) => ({ ...current, allergies: e.target.value }))} />
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 lg:col-span-2">
                      <Label>Existing conditions (optional)</Label>
                      <Textarea className="mt-2 min-h-[96px]" value={profileForm.medical_conditions} onChange={(e) => setProfileForm((current) => ({ ...current, medical_conditions: e.target.value }))} />
                    </div>
                  </div>
                  <Button className="mt-5 rounded-2xl" disabled={savingProfile} onClick={saveEmergencyProfile}>
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Secure emergency profile"}
                  </Button>
                </section>
              </TabsContent>

              <TabsContent value="qr" className="mt-0">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <SectionIntro
                    eyebrow="Steps 4 & 5"
                    title="Activate the Emergency QR"
                    description="Generate the emergency card, review the QR-backed identity, and mark it saved once it is stored on your device."
                    icon={<WalletCards className="h-5 w-5" />}
                  />
                  <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,260px]">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button className="rounded-2xl" onClick={openEmergencyCard}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Generate Emergency QR
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={async () => {
                            await markEmergencyQrSaved();
                            const next = await refreshState();
                            setActiveStep(firstIncompleteStep(next));
                            toast.success("Emergency QR marked as saved.");
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          I have saved the QR
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">QR status</p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">
                        {completion.qr ? "QR activated and saved" : "Pending generation or save confirmation"}
                      </p>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="validation" className="mt-0">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <SectionIntro
                    eyebrow="Secure validation"
                    title="Finalize eligibility with a protected activation sequence"
                    description="CliniLocker intentionally delays the final activation to maintain a medically serious identity experience instead of an instant-reward pattern."
                    icon={<FileLock2 className="h-5 w-5" />}
                  />
                  <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,260px]">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex items-start gap-3">
                        <ShieldEllipsis className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                        <div>
                          <h3 className="font-semibold text-slate-950">Eligibility Under Secure Validation</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            The final activation checks your completed emergency profile, founding slot availability,
                            and Emergency QR readiness before any access is unlocked.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="mt-5 rounded-2xl"
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
                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Current state</p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">
                        {approved ? "Approved" : launchOfferOnly ? "Launch Offer active" : canValidate ? "Ready for secure validation" : "Pending earlier checkpoints"}
                      </p>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="order" className="mt-0">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <SectionIntro
                    eyebrow="Founding500 access"
                    title="Secure ordering for the physical Emergency Kit"
                    description="Ordering stays hidden behind identity activation. Once unlocked, checkout remains single-use, verified, and address-aware."
                    icon={<ShieldCheck className="h-5 w-5" />}
                  />
                  <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,260px]">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-sm text-slate-400 line-through">₹{state.pricing.originalPrice}</span>
                        <span className="text-3xl font-semibold text-slate-950">₹{state.pricing.discountedPrice}</span>
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

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                        <Button className="rounded-2xl" disabled={creatingOrder || (!approved && !launchOfferOnly)} onClick={handleOrder}>
                          {creatingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : "Secure order"}
                        </Button>
                        {latestOrderStatus === "awaiting_payment" && state.latestOrder?.id && (
                          <Button
                            variant="outline"
                            className="rounded-2xl"
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
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Order state</p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">
                        {completion.order ? "Order confirmed" : latestOrderStatus ? latestOrderStatus.replace(/_/g, " ") : "Not started"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">One verified phone number, one account, one confirmed claim.</p>
                    </div>
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-8 xl:h-fit">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Live Overview</p>
              <div className="mt-4 space-y-3">
                {stepDefs.map((step) => (
                  <div key={step.key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                    <span className="text-sm font-medium text-slate-700">{step.label}</span>
                    {completion[step.key] ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#0f172a_0%,_#172554_100%)] p-5 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Identity posture</p>
                  <p className="mt-1 text-lg font-semibold">
                    {approved ? "Emergency Identity active" : launchOfferOnly ? "Launch Offer mode" : "Secure rollout in progress"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/75">
                The activation sequence is deliberately paced to feel clinically serious, trustworthy, and infrastructure-grade.
              </p>
            </div>
          </aside>
        </div>
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
    </PatientLayout>
  );
}
