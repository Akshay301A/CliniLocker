import QRCode from "qrcode.react";
import type { HealthCardRow } from "@/lib/supabase";
import { useAbhaStore } from "@/lib/abhaStore";
import { ABHA_FEATURE_ENABLED } from "@/lib/featureFlags";

type Props = {
  card: HealthCardRow;
  containerRef?: React.Ref<HTMLDivElement>;
};

export default function HealthCardDisplay({ card, containerRef }: Props) {
  const { isAbhaLinked, abhaProfile } = useAbhaStore();
  const qrUrl = `${window.location.origin}/user/${card.health_id}`;
  const prefersAbha = ABHA_FEATURE_ENABLED && isAbhaLinked && !!abhaProfile;
  const displayName = prefersAbha ? abhaProfile.name : card.name || "CliniLocker User";
  const primaryLabel = prefersAbha ? "ABHA Number" : "Health ID";
  const primaryValue = prefersAbha ? abhaProfile.abhaNumber : card.health_id;
  const secondaryValue = prefersAbha ? abhaProfile.abhaAddress : null;

  return (
    <div className="w-full max-w-xl mx-auto" ref={containerRef}>
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-[#2c1c62] via-[#3a2b7a] to-[#1c2f6e] text-white shadow-[0_28px_70px_rgba(6,16,40,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.4),transparent_55%)]" />
        <div className="absolute inset-0 opacity-40">
          <span className="absolute left-6 top-16 text-[64px] font-black tracking-[0.25em] text-white/10">VISA</span>
        </div>
        <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#f97316] via-[#fb923c] to-[#f97316]" />

        <div className="relative flex min-h-[210px] flex-col justify-between p-6 sm:p-7">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-400 shadow-[0_8px_20px_rgba(253,160,133,0.4)]" />
            </div>
            <img src="/favicon.png" alt="CliniLocker" className="h-8 w-8 object-contain" />
          </div>

          <div className="grid items-end gap-3 sm:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              {prefersAbha && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/95">
                  ABHA Linked
                </span>
              )}

              <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {displayName}
              </p>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs text-white/90">
                Blood Group
                <span className="font-semibold text-white">{card.blood_group || "-"}</span>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/70 sm:text-xs">
                  {primaryLabel}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-white/90 sm:text-sm">
                  {primaryValue}
                </p>
                {secondaryValue && (
                  <p className="text-[11px] text-white/75 sm:text-xs">{secondaryValue}</p>
                )}
                {prefersAbha && (
                  <p className="text-[10px] text-white/60 sm:text-[11px]">
                    Internal CliniLocker ID: {card.health_id}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="rounded-xl bg-white p-2 shadow-lg">
                <QRCode value={qrUrl} size={86} bgColor="#FFFFFF" fgColor="#1f2937" />
              </div>
              <div className="relative h-8 w-14">
                <span className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white/25" />
                <span className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white/45" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {prefersAbha
          ? "ABHA is shown as the primary patient identity, while report access still resolves safely through your CliniLocker card."
          : "Scan to view the patient card first, then open linked reports tied to this health ID."}
      </p>
    </div>
  );
}
