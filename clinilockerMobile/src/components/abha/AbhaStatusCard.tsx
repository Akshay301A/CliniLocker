import { Link } from "react-router-dom";
import { Shield, QrCode, Fingerprint } from "lucide-react";
import { useAbhaStore } from "@/lib/abhaStore";

function maskAbhaNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  const tail = digits.slice(-4);
  return `XXXX-XXXX-${tail}`;
}

export const AbhaStatusCard = () => {
  const { isAbhaLinked, abhaProfile } = useAbhaStore();

  if (!isAbhaLinked || !abhaProfile) {
    return (
      <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-[#0055BB] via-blue-600 to-indigo-600 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
              <Shield className="h-3.5 w-3.5" /> ABHA
            </span>
            <h2 className="mt-3 text-xl font-semibold">Activate National Health ID</h2>
            <p className="mt-1 text-sm text-blue-100">
              Link your ABHA to sync verified digital records securely.
            </p>
          </div>
          <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase">New</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/patient/abha/activate"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0055BB] shadow-sm"
          >
            Activate ABHA
          </Link>
          <Link
            to="/patient/abha/consents"
            className="text-xs font-semibold text-blue-100 underline-offset-4 hover:underline"
          >
            View consent requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-[#0055BB] via-blue-600 to-indigo-600 p-5 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">ABHA Linked</p>
            <h3 className="text-lg font-semibold">{abhaProfile.name}</h3>
          </div>
        </div>
        <Link
          to="/patient/abha/consents"
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold"
        >
          Requests
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{maskAbhaNumber(abhaProfile.abhaNumber)}</p>
          <p className="text-xs text-blue-100">{abhaProfile.abhaAddress}</p>
        </div>
        <Link
          to="/patient/abha/timeline"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/20"
          aria-label="Open ABHA QR"
        >
          <QrCode className="h-5 w-5" />
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-blue-100">
        <span className="rounded-full bg-white/15 px-3 py-1">Official/Verified</span>
        <Link to="/patient/abha/timeline" className="font-semibold underline-offset-4 hover:underline">
          View ABHA timeline
        </Link>
      </div>
    </div>
  );
};
