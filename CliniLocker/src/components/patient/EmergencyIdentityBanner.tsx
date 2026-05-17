import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getFounding500State, type EmergencyCampaignState } from "@/lib/api";
import { Button } from "@/components/ui/button";

function BannerShell({
  headline,
  subline,
  cta,
}: {
  headline: string;
  subline: string;
  cta: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-[linear-gradient(90deg,_#081225_0%,_#0f2748_40%,_#122f53_100%)] px-3.5 py-2.5 text-white sm:px-4 md:px-8 xl:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            Emergency Identity Rollout
          </div>
          <p className="mt-1 text-sm font-semibold tracking-tight text-white md:text-[15px]">{headline}</p>
          <p className="mt-0.5 text-xs text-cyan-50/80 md:text-sm">{subline}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button asChild className="h-9 rounded-2xl bg-white px-4 text-slate-950 hover:bg-cyan-50">
            <Link to="/patient/emergency-identity">
              {cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
        headline="Activate your Emergency Medical Identity."
        subline="Open the activation center to continue secure onboarding."
        cta="Open rollout"
      />
    );
  }

  if (!state) return null;

  const approved = state.activation?.eligibility_status === "approved";
  const closed = state.activation?.eligibility_status === "launch_offer" || state.campaignClosed;

  const headline = approved
    ? `Emergency Identity active • ${String(state.activation?.founding_member_id ?? "Founding access secured")}`
    : closed
      ? "Founding500 complimentary allocation is closed. Launch Offer is active."
      : `${state.completedSteps} of ${state.steps.length} Emergency Identity checkpoints completed`;

  const subline = approved
    ? "You can continue to secure ordering for the physical emergency kit."
    : `${state.counts.kitsRemaining} kits remain in the current rollout. Secure your medical history to continue.`;

  return <BannerShell headline={headline} subline={subline} cta={approved ? "Continue activation" : "Activate identity"} />;
}
