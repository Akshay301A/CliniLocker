import { ShieldCheck, XCircle } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { useAbhaStore } from "@/lib/abhaStore";

export default function AbhaConsentDashboard() {
  const { pendingConsents, approveConsent, denyConsent } = useAbhaStore();

  return (
    <PatientLayout>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-blue-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0055BB]">Consent Manager</p>
          <h1 className="mt-2 text-2xl font-bold">Pending Data Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Approve or deny access to your ABHA records.</p>
        </div>

        {pendingConsents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-blue-50" />
            <h3 className="text-lg font-semibold">You’re all caught up!</h3>
            <p className="text-sm text-muted-foreground">No pending requests right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingConsents.map((consent) => (
              <div key={consent.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{consent.facilityName}</h3>
                    <p className="text-xs text-muted-foreground">Expiry: {consent.expiry}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {consent.dataTypes.map((type) => (
                        <span
                          key={type}
                          className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#0055BB]"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={() => approveConsent(consent.id)}
                    className="flex-1 bg-[#0055BB] hover:bg-[#0047a0]"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    onClick={() => denyConsent(consent.id)}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
