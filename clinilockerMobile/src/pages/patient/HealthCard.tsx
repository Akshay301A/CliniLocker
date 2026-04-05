import { useEffect, useState } from "react";
import { PatientLayout } from "@/components/PatientLayout";
import { ensureHealthCardExists } from "@/lib/api";
import type { HealthCardRow } from "@/lib/supabase";
import HealthCardDisplay from "@/components/patient/HealthCardDisplay";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; card: HealthCardRow };

const PatientHealthCard = () => {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    ensureHealthCardExists().then((card) => {
      if (!active) return;
      if (!card) {
        setState({ status: "error", message: "Unable to create your health card. Please try again." });
        return;
      }
      setState({ status: "ready", card });
    });
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <PatientLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
          <div className="text-muted-foreground text-sm">Preparing your digital health card…</div>
        </div>
      </PatientLayout>
    );
  }

  if (state.status === "error") {
    return (
      <PatientLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 text-red-500 text-sm text-center">
          {state.message}
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <HealthCardDisplay card={state.card} />
      </div>
    </PatientLayout>
  );
};

export default PatientHealthCard;
