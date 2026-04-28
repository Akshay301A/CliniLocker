import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode.react";
import { Clock3, Inbox, ScanLine, ShieldCheck } from "lucide-react";
import { DoctorLayout } from "@/components/DoctorLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getDoctorShares, getProfile } from "@/lib/api";
import type { ShareRow } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

export default function DoctorDashboard() {
  const { user, isVerified } = useAuth();
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [doctorName, setDoctorName] = useState("Doctor");

  useEffect(() => {
    getProfile().then((profile) => {
      setDoctorName(profile?.full_name?.trim() || "Doctor");
    });
    getDoctorShares().then(setShares);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`doctor-shares-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shares", filter: `doctor_id=eq.${user.id}` },
        async () => {
          const next = await getDoctorShares();
          setShares(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const unreadCount = useMemo(() => shares.filter((share) => share.unread).length, [shares]);

  return (
    <DoctorLayout>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-6 text-white shadow-[0_24px_80px_rgba(37,99,235,0.25)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Doctor Home</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Welcome, {doctorName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
              Every patient share arrives here instantly. Tap any share to review the files and add quick notes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Unread shares</p>
                <p className="mt-1 text-2xl font-bold">{unreadCount}</p>
              </div>
              <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Verification</p>
                <p className="mt-1 text-lg font-bold">{isVerified ? "Verified" : "Pending review"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Patient Shares Inbox</h2>
                <p className="mt-1 text-sm text-slate-500">Realtime feed of reports that patients have explicitly shared with you.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                <Inbox className="h-4 w-4" />
                {shares.length} total
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {shares.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                  <ShieldCheck className="mx-auto h-10 w-10 text-blue-600" />
                  <h3 className="mt-4 text-lg font-bold text-slate-900">No patient shares yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Once a patient scans your QR and sends reports, they will show up here instantly.
                  </p>
                </div>
              ) : (
                shares.map((share) => (
                  <Link
                    key={share.id}
                    to={`/doctor/share/${share.id}`}
                    className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-blue-200 hover:bg-blue-50/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="truncate text-lg font-bold text-slate-900">{share.patient_name || "Patient"}</p>
                        {share.unread && (
                          <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                            New
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span>{new Date(share.created_at ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>{share.report_ids.length} report{share.report_ids.length === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      Review
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              <ScanLine className="h-4 w-4" />
              Your share QR
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">UPI-style patient sharing</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Patients scan this QR from their dashboard, select reports, and send them directly into your inbox.
            </p>
            <div className="mt-6 rounded-[28px] bg-slate-950 p-5 text-center text-white">
              <div className="mx-auto inline-flex rounded-[24px] bg-white p-4">
                <QRCode
                  value={user?.id || ""}
                  size={220}
                  bgColor="#FFFFFF"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin
                />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Doctor UUID</p>
              <p className="mt-2 break-all text-sm text-slate-100">{user?.id}</p>
            </div>
          </div>
        </aside>
      </div>
    </DoctorLayout>
  );
}
