import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileLock2,
  Loader2,
  ShieldCheck,
  ShieldEllipsis,
  Smartphone,
  Upload,
  UserRound,
  WalletCards,
} from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Preloader } from "@/components/Preloader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import HealthCardDisplay from "@/components/patient/HealthCardDisplay";
import {
  completeFounding500Validation,
  createFounding500Order,
  ensureHealthCardExists,
  getPatientReports,
  getProfile,
  getFounding500State,
  markFounding500PhoneVerified,
  markEmergencyQrGenerated,
  markEmergencyQrSaved,
  startFounding500Validation,
  syncFounding500Order,
  updateProfile,
  verifyFounding500Msg91Otp,
  type EmergencyCampaignState,
  type Founding500ShippingAddress,
} from "@/lib/api";
import {
  ensureMsg91Widget,
  extractMsg91ReqId,
  getMsg91ReqId,
  isMsg91OtpConfigured,
  retryMsg91Otp,
  sendMsg91Otp,
  verifyMsg91Otp,
} from "@/lib/msg91";
import type { HealthCardRow } from "@/lib/supabase";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: "_modal" | "_self" | "_blank" | "_top" }) => Promise<unknown>;
    };
  }
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATIONSHIP_OPTIONS = ["Parent", "Spouse", "Sibling", "Child", "Guardian", "Friend", "Other"];
const STEP_ORDER = ["verify", "records", "profile", "qr", "validation", "order"] as const;
type StepKey = (typeof STEP_ORDER)[number];
type FeedbackState = {
  tone: "success" | "error" | "info";
  title: string;
  message: string;
} | null;
type EmergencyIdentityCache = {
  state: EmergencyCampaignState | null;
  phone: string;
  otpRequested: boolean;
  otpReqId: string | null;
  activeStep: StepKey;
  visibleReportCount: number;
  profileForm: {
    blood_group: string;
    emergency_contact_name: string;
    emergency_contact_relation: string;
    emergency_contact_phone: string;
    allergies: string;
    medical_conditions: string;
  };
};

let emergencyIdentityPageCache: EmergencyIdentityCache | null = null;

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

function normalizePhoneForOtp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return value.startsWith("+") ? value : `+${digits}`;
}

function clearOtpWidgetContainer() {
  const container = document.getElementById("emergency-identity-msg91-captcha");
  if (container) {
    container.innerHTML = "";
  }
}

function getOtpErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = typeof error === "object" && error && "message" in error ? String((error as { message?: string }).message ?? "") : "";

  if (message.toLowerCase().includes("otp")) {
    return message;
  }

  if (message.includes("already been rendered in this element")) {
    return "OTP security check was already open. Please try again once.";
  }

  switch (code) {
    case "auth/too-many-requests":
      return "Too many OTP requests were made recently. Wait a little and try again.";
    case "auth/invalid-phone-number":
      return "Enter a valid mobile number with country code.";
    case "auth/operation-not-allowed":
      return "SMS OTP is not enabled correctly yet.";
    case "auth/quota-exceeded":
      return "SMS OTP quota is currently exhausted. Try again later.";
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
      return "Security verification failed. Refresh the page and try again.";
    case "auth/missing-phone-number":
      return "Enter the phone number first.";
    case "auth/code-expired":
      return "This OTP has expired. Request a new one.";
    case "auth/invalid-verification-code":
      return "The OTP entered is incorrect.";
    case "auth/session-expired":
      return "This OTP session expired. Request a new code.";
    default:
      return message || "Unable to complete OTP verification right now.";
  }
}

function getOrderErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to continue with the order right now.";

  if (message.includes("Emergency kit already claimed for this account")) {
    return "This account has already secured an Emergency Kit order.";
  }
  if (message.includes("Cashfree payment session missing")) {
    return "Payment session could not be prepared. Please try again.";
  }
  if (message.includes("Cashfree SDK not available")) {
    return "Payment gateway could not be opened right now. Please try again once.";
  }
  if (message.includes("Complete the shipping address")) {
    return "Complete the shipping address before continuing.";
  }

  return message.replace(/^Edge Function returned a non-2xx status code:\s*/i, "");
}
function getFriendlyMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return message.replace(/^Edge Function returned a non-2xx status code:\s*/i, "");
}

function getOrderReferenceValue(state: EmergencyCampaignState | null) {
  return String(
    state?.latestOrder?.merchant_order_id ??
      state?.latestOrder?.id ??
      state?.activation?.founding_member_id ??
      "",
  ).trim();
}

function FeedbackCard({ feedback }: { feedback: Exclude<FeedbackState, null> }) {
  const toneClass =
    feedback.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : feedback.tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-sky-200 bg-sky-50 text-sky-900";
  const Icon = feedback.tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`rounded-[28px] border px-5 py-5 shadow-sm ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight">{feedback.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90 md:text-[15px]">{feedback.message}</p>
        </div>
      </div>
    </div>
  );
}

function getStepCompletion(state: EmergencyCampaignState) {
  return {
    verify: Boolean(state.steps[0]?.completed),
    records: Boolean(state.steps[1]?.completed),
    profile: Boolean(state.steps[2]?.completed),
    qr: Boolean(state.steps[3]?.completed && state.steps[4]?.completed),
    validation: state.activation?.eligibility_status === "approved" || state.activation?.eligibility_status === "launch_offer",
    order: ["paid", "fulfilled"].includes(String(state.latestOrder?.status ?? "")),
  };
}

function firstIncompleteStep(state: EmergencyCampaignState): StepKey {
  const completion = getStepCompletion(state);
  return STEP_ORDER.find((step) => !completion[step]) ?? "order";
}

function getNextStep(step: StepKey): StepKey {
  const index = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)];
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
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
  const [state, setState] = useState<EmergencyCampaignState | null>(emergencyIdentityPageCache?.state ?? null);
  const [loading, setLoading] = useState(!emergencyIdentityPageCache?.state);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [activeStep, setActiveStep] = useState<StepKey>(emergencyIdentityPageCache?.activeStep ?? "verify");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState(emergencyIdentityPageCache?.phone ?? "");
  const [otpRequested, setOtpRequested] = useState(emergencyIdentityPageCache?.otpRequested ?? false);
  const [otpReqId, setOtpReqId] = useState<string | null>(emergencyIdentityPageCache?.otpReqId ?? null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [visibleReportCount, setVisibleReportCount] = useState(emergencyIdentityPageCache?.visibleReportCount ?? 0);
  const [profileForm, setProfileForm] = useState(
    emergencyIdentityPageCache?.profileForm ?? {
      blood_group: "",
      emergency_contact_name: "",
      emergency_contact_relation: "",
      emergency_contact_phone: "",
      allergies: "",
      medical_conditions: "",
    },
  );
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
  const cleanupOtpWidget = () => {
    clearOtpWidgetContainer();
    setOtpRequested(false);
    setOtpReqId(null);
  };

  useEffect(() => {
    emergencyIdentityPageCache = {
      state,
      phone,
      otpRequested,
      otpReqId,
      activeStep,
      visibleReportCount,
      profileForm,
    };
  }, [activeStep, otpReqId, otpRequested, phone, profileForm, state, visibleReportCount]);

  const refreshState = async () => {
    const [next, localProfile, localReports] = await Promise.all([
      getFounding500State(),
      getProfile().catch(() => null),
      getPatientReports().catch(() => []),
    ]);
    const mergedProfile = {
      ...(next.profile ?? {}),
      ...(localProfile ?? {}),
    };
    const mergedNext = {
      ...next,
      profile: mergedProfile,
      medicalRecordsCount: Math.max(Number(next.medicalRecordsCount ?? 0), localReports.length),
    };
    setVisibleReportCount(localReports.length);
    setState(mergedNext);
    setPhone(mergedProfile.phone ?? "");
    setProfileForm({
      blood_group: mergedProfile.blood_group ?? "",
      emergency_contact_name: mergedProfile.emergency_contact_name ?? "",
      emergency_contact_relation: mergedProfile.emergency_contact_relation ?? "",
      emergency_contact_phone: mergedProfile.emergency_contact_phone ?? "",
      allergies: mergedProfile.allergies ?? "",
      medical_conditions: mergedProfile.medical_conditions ?? "",
    });
    setShipping((prev) => ({
      ...prev,
      shipping_name: prev.shipping_name || mergedProfile.full_name || "",
      shipping_phone: prev.shipping_phone || mergedProfile.phone || "",
    }));
    setActiveStep((current) => (STEP_ORDER.includes(current) ? current : firstIncompleteStep(mergedNext as EmergencyCampaignState)));
    return mergedNext as EmergencyCampaignState;
  };

  useEffect(() => {
    let mounted = true;
    refreshState()
      .catch((error) => {
        if (mounted) {
          const message = error instanceof Error ? error.message : "Unable to load Emergency Identity rollout.";
          setLoadError(message);
          setFeedback({
            tone: "error",
            title: "Emergency Identity is temporarily unavailable",
            message,
          });
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
    return () => {
      cleanupOtpWidget();
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
          setFeedback({
            tone: "success",
            title: result.status === "approved" ? "Emergency Identity activated" : "Launch Offer active",
            message:
              result.status === "approved"
                ? `Your medical identity is now active${result.foundingMemberId ? ` â€¢ ${result.foundingMemberId}` : ""}.`
                : "The complimentary Founding500 allocation has closed. Launch Offer pricing is now active.",
          });
        })
        .catch((error) =>
          setFeedback({
            tone: "error",
            title: "Secure validation could not be completed",
            message: getFriendlyMessage(error, "Secure validation failed."),
          }),
        )
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
  const launchTestMode = searchParams.get("mode") === "launch-test" && Boolean(state.profile?.is_admin);
  const serverCompletion = getStepCompletion(state);
  const localProfileComplete = Boolean(
    profileForm.blood_group &&
      profileForm.emergency_contact_name &&
      profileForm.emergency_contact_phone,
  );
  const effectiveMedicalRecordsCount = Math.max(state.medicalRecordsCount, visibleReportCount);
  const completion = {
    ...serverCompletion,
    records: serverCompletion.records || effectiveMedicalRecordsCount >= 2,
    profile: serverCompletion.profile || localProfileComplete,
  };
  const canValidate = completion.verify && completion.records && completion.profile && completion.qr;
  const latestOrderStatus = String(state.latestOrder?.status ?? "");
  const orderClaimed = Boolean(state.activation?.order_claimed_at);
  const orderConfirmed = completion.order || ["paid", "fulfilled"].includes(latestOrderStatus) || orderClaimed;
  const orderReference = getOrderReferenceValue(state);
  const stepDefs: Array<{ key: StepKey; label: string; short: string }> = [
    { key: "verify", label: "Phone verification", short: "Verify" },
    { key: "records", label: "Medical records", short: "Records" },
    { key: "profile", label: "Emergency profile", short: "Profile" },
    { key: "qr", label: "Digital health ID card", short: "Card" },
    { key: "validation", label: "Secure validation", short: "Validate" },
    { key: "order", label: "Emergency kit", short: "Order" },
  ];
  const currentStepIndex = Math.max(0, stepDefs.findIndex((step) => step.key === activeStep));
  const currentStep = stepDefs[currentStepIndex];
  const previousStep = currentStepIndex > 0 ? stepDefs[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < stepDefs.length - 1 ? stepDefs[currentStepIndex + 1] : null;
  const completedCount = Object.values(completion).filter(Boolean).length;

  const openEmergencyCard = async () => {
    setCardOpen(true);
    setCardLoading(true);
    try {
      const ensured = await ensureHealthCardExists(state.profile);
      if (!ensured) throw new Error("Unable to prepare Emergency QR.");
      await markEmergencyQrGenerated();
      setCard(ensured);
      await refreshState();
      setActiveStep("qr");
      setFeedback({
        tone: "info",
        title: "Digital health ID card is ready",
        message: "Review the card, save it to your device, and then continue to secure validation.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Unable to open the digital health ID card",
        message: getFriendlyMessage(error, "Unable to open the digital health ID card right now."),
      });
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
      setFeedback({
        tone: "error",
        title: "Emergency profile could not be saved",
        message: result.error || "Please review the details and try again.",
      });
      return;
    }
    await refreshState();
    setActiveStep(getNextStep("profile"));
    setFeedback({
      tone: "success",
      title: "Emergency profile secured",
      message: "Your emergency contact and medical basics are now attached to this identity.",
    });
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      if (!isMsg91OtpConfigured()) {
        throw new Error("MSG91 OTP is not configured yet.");
      }

      await ensureMsg91Widget();
      const normalizedPhone = normalizePhoneForOtp(phone).replace(/^\+/, "");
      const result = await sendMsg91Otp(normalizedPhone);
      setOtpRequested(true);
      setOtpReqId(extractMsg91ReqId(result) ?? getMsg91ReqId());
      setOtp("");
      setPhone(`+${normalizedPhone}`);
      setFeedback({
        tone: "info",
        title: "Verification code sent",
        message: `An OTP has been sent to ${`+${normalizedPhone}`}. Enter it below to secure this step.`,
      });
    } catch (error) {
      cleanupOtpWidget();
      setFeedback({
        tone: "error",
        title: "Unable to send verification code",
        message: getOtpErrorMessage(error),
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      if (!otpRequested) throw new Error("Request the verification code first.");
      if (otpReqId) {
        await verifyFounding500Msg91Otp(phone, otp, otpReqId);
      } else {
        await ensureMsg91Widget();
        await verifyMsg91Otp(otp);
        await markFounding500PhoneVerified(phone);
      }
      setOtp("");
      setOtpRequested(false);
      setOtpReqId(null);
      setState((current) =>
        current
          ? {
              ...current,
              profile: current.profile
                ? {
                    ...current.profile,
                    phone,
                    phone_verified: true,
                  }
                : current.profile,
              activation: {
                ...current.activation,
                phone_verified_at: new Date().toISOString(),
              },
              steps: current.steps.map((step, index) =>
                index === 0 ? { ...step, completed: true } : step,
              ),
              completedSteps: Math.max(current.completedSteps, 1),
              progressPercent: Math.max(current.progressPercent, Math.round((1 / current.steps.length) * 100)),
            }
          : current,
      );
      await refreshState();
      setActiveStep(getNextStep("verify"));
      setFeedback({
        tone: "success",
        title: "Phone number secured",
        message: "This emergency identity now has a verified contact channel.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Verification could not be completed",
        message: getOtpErrorMessage(error),
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      if (!otpReqId) throw new Error("Send the OTP first.");
      const result = await retryMsg91Otp(otpReqId);
      setOtpReqId(extractMsg91ReqId(result) ?? getMsg91ReqId() ?? otpReqId);
      setFeedback({
        tone: "info",
        title: "A new OTP has been sent",
        message: "Use the latest SMS code to continue verification.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Unable to resend OTP",
        message: getOtpErrorMessage(error),
      });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleOrder = async () => {
    setCreatingOrder(true);
    try {
      const created = await createFounding500Order(shipping, { forceLaunchOffer: launchTestMode });
      if (created.checkoutMode === "internal") {
        setState((current) =>
          current
            ? {
                ...current,
                activation: {
                  ...current.activation,
                  order_claimed_at: new Date().toISOString(),
                },
                latestOrder: {
                  ...(current.latestOrder ?? {}),
                  ...(created.order ?? {}),
                  status: "fulfilled",
                },
              }
            : current,
        );
        setActiveStep("order");
        setFeedback({
          tone: "success",
          title: "Order confirmed",
          message: "Your Founding500 Emergency Kit has been secured successfully.",
        });
        await refreshState();
        return;
      }

      if (!created.paymentSessionId) throw new Error("Cashfree payment session missing.");
      await refreshState();
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
      setFeedback({
        tone: "error",
        title: "Order could not be continued",
        message: getOrderErrorMessage(error),
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  const heroStatus = orderConfirmed
    ? `Emergency Identity activated${state.activation?.founding_member_id ? ` - ${state.activation.founding_member_id}` : ""}. Your physical kit request is already secured.`
    : approved
      ? `Emergency Identity secured${state.activation?.founding_member_id ? ` - ${state.activation.founding_member_id}` : ""}`
      : launchOfferOnly
        ? "Launch Offer is active."
        : `${state.completedSteps} of ${state.steps.length} checkpoints completed.`;
  const foundingSequence = String(state.activation?.founding_member_id ?? "").split("-").pop() || "";
  const displayName = String(state.profile?.full_name ?? "CliniLocker member").trim();

  const renderFooterNav = () => (
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl"
        disabled={!previousStep}
        onClick={() => previousStep && setActiveStep(previousStep.key)}
      >
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl"
        disabled={!nextStep}
        onClick={() => nextStep && setActiveStep(nextStep.key)}
      >
        Continue
      </Button>
    </div>
  );

  return (
    <PatientLayout>
      <div className="mx-auto max-w-5xl space-y-4 animate-fade-in">
        <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef5ff_45%,_#ffffff_100%)] p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
                {orderConfirmed ? "Activation complete" : "Emergency Identity"}
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {orderConfirmed ? "Emergency Identity is active." : "Activate your emergency kit access step by step."}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">{heroStatus}</p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-[420px]">
              <StatChip label="Kits Left" value={state.counts.kitsRemaining} />
              <StatChip label={orderConfirmed ? "Order" : "Progress"} value={orderConfirmed ? (orderReference || "Secured") : `${state.progressPercent}%`} />
              <StatChip label="Price" value={`Rs. ${launchTestMode ? Number(state.campaign.launch_price ?? 199) : state.pricing.discountedPrice}`} />
            </div>
          </div>
          {launchTestMode && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Admin launch-test mode is active for this account. Secure order will open the Launch Offer Cashfree flow for testing.
            </div>
          )}
        </section>

        {feedback && <FeedbackCard feedback={feedback} />}

        {orderConfirmed && (
          <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f7fbff_100%)] px-6 py-8 md:px-10 md:py-10">
              <p className="text-sm font-semibold tracking-tight text-slate-950">CliniLocker</p>
              <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="font-display text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                    Order
                    <br />
                    confirmation
                  </h2>
                  <p className="mt-6 text-lg font-medium text-slate-950">Hi {displayName},</p>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                    Your Emergency Identity is active and we have successfully secured your Founding500 Emergency Kit request. We will keep this order linked to your medical identity while the rollout is being processed.
                  </p>
                </div>

                <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-900 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Activation status</p>
                  <p className="mt-2 text-lg font-semibold">Emergency Identity activated</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 md:px-10 md:py-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[30px] border border-slate-200 bg-slate-50/70 p-5 md:p-6">
                <p className="text-lg font-semibold text-slate-950">Order summary</p>
                <div className="mt-5 flex gap-4 rounded-[26px] border border-slate-200 bg-white p-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,_#dbeafe_0%,_#eff6ff_45%,_#ffffff_100%)]">
                    <ShieldCheck className="h-9 w-9 text-sky-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-slate-950">CliniLocker Emergency Kit</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Founding500 rollout kit with digital health ID support
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Includes emergency identity activation, physical emergency card support, and the linked QR sticker pack for urgent care access.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Original price</span>
                    <span className="line-through">Rs. {state.pricing.originalPrice}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Founding500 access</span>
                    <span className="font-semibold text-emerald-700">Rs. 0</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-semibold text-slate-950">
                    <span>Total</span>
                    <span>Rs. 0</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Founding member ID</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    {String(state.activation?.founding_member_id ?? "Secured")}
                  </p>
                  {foundingSequence && (
                    <p className="mt-2 text-sm text-slate-500">Founding slot number {foundingSequence}</p>
                  )}
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Order reference</p>
                  <p className="mt-3 break-all text-2xl font-semibold tracking-tight text-slate-950">
                    {orderReference || "Order secured"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    This reference is generated by CliniLocker when your kit request is secured.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {!orderConfirmed && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Step {currentStepIndex + 1} of {stepDefs.length}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-slate-950">{currentStep.label}</h2>
              <p className="mt-1 text-sm text-slate-600">{completedCount} steps completed so far.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                disabled={!previousStep}
                onClick={() => previousStep && setActiveStep(previousStep.key)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                disabled={!nextStep}
                onClick={() => nextStep && setActiveStep(nextStep.key)}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Progress
              value={((currentStepIndex + 1) / stepDefs.length) * 100}
              className="h-2.5 bg-slate-100 [&>div]:bg-[linear-gradient(90deg,_#0ea5e9_0%,_#2563eb_100%)]"
            />
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600 md:hidden">
            Current step: <span className="font-semibold text-slate-900">{currentStep.label}</span>
          </div>

          <div className="mt-4 hidden gap-2 overflow-x-auto pb-1 md:flex">
            {stepDefs.map((step, index) => {
              const done = completion[step.key];
              const active = activeStep === step.key;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                    active
                      ? "border-sky-200 bg-sky-50 text-slate-950"
                      : done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-emerald-600 text-white" : active ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className="whitespace-nowrap font-medium">{step.short}</span>
                </button>
              );
            })}
          </div>
        </section>
        )}

        {!orderConfirmed && activeStep === "verify" && (
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
                    {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send SMS OTP"}
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" />
                  <Button disabled={verifyingOtp} onClick={handleVerifyOtp}>
                    {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto rounded-xl px-0 text-sm text-sky-700 hover:bg-transparent hover:text-sky-800"
                    disabled={!otpRequested || resendingOtp}
                    onClick={handleResendOtp}
                  >
                    {resendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Resend OTP
                  </Button>
                  <p className="text-xs text-slate-500">MSG91 handles OTP delivery for this identity step.</p>
                </div>
                <div id="emergency-identity-msg91-captcha" className="mt-3 min-h-0" />
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {completion.verify ? "Phone secured" : "Pending verification"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  SMS verification is handled through MSG91 so emergency onboarding stays smoother on the web.
                </p>
              </div>
            </div>
            {renderFooterNav()}
          </section>
        )}

        {!orderConfirmed && activeStep === "records" && (
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
                  Your uploads are checked for secure activation readiness. Older valid reports already present in your account are also counted automatically, so returning users do not need to re-upload everything.
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
                <p className="mt-3 text-3xl font-semibold text-slate-950">{Math.min(effectiveMedicalRecordsCount, 2)}/2</p>
                <p className="mt-2 text-sm text-slate-600">
                  {completion.records ? "Record threshold complete." : "Two validated medical records required."}
                </p>
              </div>
            </div>
            {renderFooterNav()}
          </section>
        )}

        {!orderConfirmed && activeStep === "profile" && (
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <SectionIntro
              eyebrow="Step 3"
              title="Complete the emergency profile"
              description="Add the emergency details that matter in urgent care scenarios. If these details already exist in your profile, this step will reflect them automatically."
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
                <select
                  className="mt-2 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={profileForm.emergency_contact_relation}
                  onChange={(e) => setProfileForm((current) => ({ ...current, emergency_contact_relation: e.target.value }))}
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
            {renderFooterNav()}
          </section>
        )}

        {!orderConfirmed && activeStep === "qr" && (
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <SectionIntro
              eyebrow="Steps 4 & 5"
              title="Activate the Digital Health ID card"
              description="Generate your digital health ID card, review the patient QR shown on the card, and save it to your device. The physical emergency kit will carry the same identity with five QR stickers for quick use."
              icon={<WalletCards className="h-5 w-5" />}
            />
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,260px]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="mb-4 text-sm leading-7 text-slate-600">
                  This is your CliniLocker digital health ID card. Once generated, the card itself shows the patient QR, so there is nothing separate to generate after that.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="rounded-2xl" onClick={openEmergencyCard}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {completion.qr ? "Open digital health ID card" : "Generate digital health ID card"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                      onClick={async () => {
                        await markEmergencyQrSaved();
                      await refreshState();
                      setActiveStep(getNextStep("qr"));
                      setFeedback({
                        tone: "success",
                        title: "Digital health ID card saved",
                        message: "You can now continue to secure validation.",
                      });
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    I have saved the card
                  </Button>
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Card status</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {completion.qr ? "Digital health ID card ready" : "Pending generation or save confirmation"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  The emergency kit includes the physical card setup plus a strip of 5 matching emergency QR stickers.
                </p>
              </div>
            </div>
            {renderFooterNav()}
          </section>
        )}

        {!orderConfirmed && activeStep === "validation" && (
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
                      setFeedback({
                        tone: "error",
                        title: "Secure validation could not be started",
                        message: getFriendlyMessage(error, "Unable to start secure validation."),
                      });
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
            {renderFooterNav()}
          </section>
        )}

        {!orderConfirmed && activeStep === "order" && (
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
                  <span className="text-sm text-slate-400 line-through">Rs. {state.pricing.originalPrice}</span>
                  <span className="text-3xl font-semibold text-slate-950">Rs. {state.pricing.discountedPrice}</span>
                  {state.pricing.shippingPrice > 0 && (
                    <span className="text-sm text-slate-500">+ Rs. {state.pricing.shippingPrice} shipping</span>
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
                          setFeedback({
                            tone: "info",
                            title: "Payment status refreshed",
                            message: "The latest order status has been updated.",
                          });
                        } catch (error) {
                          setFeedback({
                            tone: "error",
                            title: "Payment status could not be refreshed",
                            message: getFriendlyMessage(error, "Unable to refresh payment."),
                          });
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
                  {orderConfirmed ? "Order confirmed" : latestOrderStatus ? latestOrderStatus.replace(/_/g, " ") : "Not started"}
                </p>
                <p className="mt-2 text-sm text-slate-600">One verified phone number, one account, one confirmed claim.</p>
              </div>
            </div>
          </section>
        )}
      </div>

      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Digital health ID card</DialogTitle>
            <DialogDescription>
              Save this health ID card to your device. The patient QR is already printed on the card layout for emergency access.
            </DialogDescription>
          </DialogHeader>
          {cardLoading && (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing digital health ID card...
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
