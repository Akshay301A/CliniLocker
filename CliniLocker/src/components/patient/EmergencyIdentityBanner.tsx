import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { getFounding500State, type EmergencyCampaignState } from "@/lib/api";
import { Button } from "@/components/ui/button";

function BannerShell({
  title,
  headline,
  subline,
  meta,
  cta,
}: {
  title: string;
  headline: string;
  subline: string;
  meta?: string;
  cta: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-[#eef5ff] px-3.5 py-2.5 sm:px-4 md:px-8 md:py-3 xl:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="overflow-hidden rounded-[26px] border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_52%,#eef6ff_100%)] shadow-[0_16px_34px_rgba(15,23,42,0.08),0_6px_18px_rgba(37,99,235,0.10)]">
          <div className="px-5 py-3.5 md:px-6 md:py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700/80">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Emergency Identity Rollout
                    </div>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-emerald-600 md:text-[22px]">{title}</p>
                  </div>
                </div>

                <p className="mt-2.5 max-w-3xl text-lg font-semibold leading-tight text-slate-950 md:text-[27px]">
                  {headline}
                </p>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">{subline}</p>
                {meta ? (
                  <div className="mt-2.5 inline-flex max-w-full items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="truncate">{meta}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-3 lg:pl-4">
                <Button asChild className="h-11 rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#2563eb_100%)] px-5 text-white shadow-[0_10px_24px_rgba(37,99,235,0.26)] hover:opacity-95">
                  <Link to="/patient/emergency-identity">
                    {cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EmergencyIdentityBanner() {
  const location = useLocation();
  const [state, setState] = useState<EmergencyCampaignState | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let mounted = true;
    getFounding500State()
      .then((data) => {
        if (mounted) {
          setState(data);
          setAvailable(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setState(null);
          setAvailable(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (location.pathname === "/patient/emergency-identity") return null;

  if (!state && !available) {
    return (
      <BannerShell
        title="Secure your Emergency Identity"
        headline="Activate your Emergency Medical Identity."
        subline="Open the activation center to continue secure onboarding."
        meta="Medical history and emergency access stay linked in one secure flow."
        cta="Open rollout"
      />
    );
  }

  if (!state) return null;

  const approved = state.activation?.eligibility_status === "approved";
  const closed = state.activation?.eligibility_status === "launch_offer" || state.campaignClosed;
  const orderConfirmed =
    ["paid", "fulfilled"].includes(String(state.latestOrder?.status ?? "")) ||
    Boolean(state.activation?.order_claimed_at);
  const orderReference = String(
    state.latestOrder?.merchant_order_id ??
      state.latestOrder?.id ??
      state.activation?.founding_member_id ??
      "",
  ).trim();

  const headline = orderConfirmed
    ? `Emergency Identity activated - ${String(state.activation?.founding_member_id ?? "Founding access secured")}`
    : approved
      ? `Emergency Identity active - ${String(state.activation?.founding_member_id ?? "Founding access secured")}`
      : closed
        ? "Founding500 complimentary allocation is closed. Launch Offer is active."
        : `${state.completedSteps} of ${state.steps.length} Emergency Identity checkpoints completed`;

  const subline = orderConfirmed
    ? `Your Emergency Kit request is secured${orderReference ? ` - ${orderReference}` : ""}.`
    : approved
      ? "Your identity is active and ready for the final kit confirmation."
      : `${state.counts.kitsRemaining} kits remain in the current rollout. Secure your medical history to continue.`;

  const title = orderConfirmed
    ? "Congratulations!"
    : approved
      ? "Emergency Identity active"
      : closed
        ? "Launch Offer is active"
        : "Secure your Emergency Identity";

  const meta = orderConfirmed
    ? "Your medical identity, founding access, and Emergency Kit request are now linked."
    : approved
      ? "One verified identity. One secure emergency profile. One final confirmation left."
      : closed
        ? "The complimentary Founding500 pool is closed, but rollout ordering is still available."
        : "Complete the remaining checkpoints to unlock the physical emergency kit flow.";

  return (
    <BannerShell
      title={title}
      headline={headline}
      subline={subline}
      meta={meta}
      cta={orderConfirmed ? "View order status" : approved ? "Continue activation" : "Activate identity"}
    />
  );
}
