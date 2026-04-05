import QRCode from "qrcode.react";
import type { HealthCardRow } from "@/lib/supabase";
import { getPublicAppBaseUrlForShare } from "@/lib/api";

type Props = {
  card: HealthCardRow;
  containerRef?: React.Ref<HTMLDivElement>;
};

export default function HealthCardDisplay({ card, containerRef }: Props) {
  const qrBase = getPublicAppBaseUrlForShare();
  const qrUrl = `${qrBase}/user/${card.health_id}`;

  return (
    <div className="w-full max-w-xl mx-auto" ref={containerRef}>
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 shadow-[0_28px_70px_rgba(6,16,40,0.45)] text-white bg-gradient-to-br from-[#2c1c62] via-[#3a2b7a] to-[#1c2f6e]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.4),transparent_55%)]" />
        <div className="absolute inset-0 opacity-40">
          <span className="absolute left-6 top-16 text-[64px] font-black tracking-[0.25em] text-white/10">VISA</span>
        </div>
        <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#f97316] via-[#fb923c] to-[#f97316]" />

        <div className="relative p-6 sm:p-7 min-h-[210px] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-400 shadow-[0_8px_20px_rgba(253,160,133,0.4)]" />
            </div>
            <img src="/favicon.png" alt="CliniLocker" className="h-8 w-8 object-contain" />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr] items-end">
            <div className="space-y-2">
              <p className="text-white text-xl sm:text-2xl font-semibold tracking-tight">
                {card.name || "CliniLocker User"}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 border border-white/20">
                Blood Group
                <span className="text-white font-semibold">{card.blood_group || "—"}</span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm tracking-[0.32em] uppercase">
                {card.health_id}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="bg-white rounded-xl p-2 shadow-lg">
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
      <p className="mt-4 text-xs text-muted-foreground text-center">
        Scan to view basic health card details. No sensitive medical data is shared.
      </p>
    </div>
  );
}
