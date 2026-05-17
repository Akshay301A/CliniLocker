import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ShieldCheck, Siren, Sparkles } from "lucide-react";
import { getFounding500State, type EmergencyCampaignState } from "@/lib/api";
import { Button } from "@/components/ui/button";

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
      <section className="border-b border-slate-200 bg-[linear-gradient(135deg,_#081225_0%,_#0f2748_42%,_#164e63_100%)] px-3.5 py-3 text-white sm:px-4 md:px-8 xl:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
              <ShieldCheck className="h-3.5 w-3.5" />
              Founding500 Emergency Identity Rollout
            </div>
            <h2 className="mt-2 text-base font-semibold tracking-tight text-white md:text-lg">
              Secure your medical history to activate your Emergency Medical Identity.
            </h2>
            <p className="mt-2 text-sm text-cyan-50/90">
              Emergency Identity rollout is available. Open the activation center to continue secure onboarding.
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-2xl bg-white px-4 text-slate-900 hover:bg-cyan-50"
          >
            <Link to="/patient/emergency-identity">
              Open Emergency Identity
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  if (!state) return null;

  const progressLabel =
    state.activation?.eligibility_status === "approved"
      ? "Emergency Identity activated"
      : `${state.completedSteps} of ${state.steps.length} Emergency Identity steps completed`;

  return (
    <section className="border-b border-slate-200 bg-[linear-gradient(135deg,_#081225_0%,_#0f2748_42%,_#164e63_100%)] px-3.5 py-3 text-white sm:px-4 md:px-8 xl:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
            <ShieldCheck className="h-3.5 w-3.5" />
            Founding500 Emergency Identity Rollout
          </div>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-white md:text-lg">
            Secure your medical history to activate your Emergency Medical Identity.
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-cyan-50/90">
            <span>{progressLabel}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-cyan-50">
              <Siren className="h-3.5 w-3.5" />
              {state.counts.kitsRemaining} kits remaining
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-cyan-50">
              <Sparkles className="h-3.5 w-3.5" />
              Identity-driven early access
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden min-w-[220px] lg:block">
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-cyan-300 transition-all"
                style={{ width: `${state.progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-cyan-100/80">{state.progressPercent}% activation complete</p>
          </div>
          <Button
            asChild
            className="h-11 rounded-2xl bg-white px-4 text-slate-900 hover:bg-cyan-50"
          >
            <Link to="/patient/emergency-identity">
              Activate Emergency Identity
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
