import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode.react";
import { Inbox, ScanLine, ShieldCheck } from "lucide-react";
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
      .channel(`doctor-shares-mobile-${user.id}`)
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
      <div className="rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-5 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Doctor Home</p>
        <h1 className="mt-2 text-3xl font-black">Welcome, {doctorName}</h1>
        <p className="mt-2 text-sm text-blue-50">All patient shares arrive here instantly after scan-to-share.</p>
        <div className="mt-5 flex gap-3">
          <div className="rounded-2xl bg-white/12 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">Unread</p>
            <p className="mt-1 text-2xl font-bold">{unreadCount}</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">Verification</p>
            <p className="mt-1 text-base font-bold">{isVerified ? "Verified" : "Pending"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          <ScanLine className="h-4 w-4" />
          Your share QR
        </div>
        <div className="mt-4 rounded-[28px] bg-slate-950 p-5 text-center text-white">
          <div className="mx-auto inline-flex rounded-[24px] bg-white p-4">
            <QRCode value={user?.id || ""} size={220} bgColor="#FFFFFF" fgColor="#0f172a" level="H" includeMargin />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Doctor UUID</p>
          <p className="mt-2 break-all text-xs text-slate-100">{user?.id}</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Patient Shares Inbox</h2>
            <p className="mt-1 text-sm text-slate-500">Realtime incoming report shares.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            <Inbox className="h-4 w-4" />
            {shares.length}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {shares.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-blue-600" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">No shares yet</h3>
              <p className="mt-2 text-sm text-slate-500">Patients will appear here after scanning your QR.</p>
            </div>
          ) : (
            shares.map((share) => (
              <Link
                key={share.id}
                to={`/doctor/share/${share.id}`}
                className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-slate-900">{share.patient_name || "Patient"}</p>
                  {share.unread && <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">New</span>}
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span>{new Date(share.created_at ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>{share.report_ids.length} report{share.report_ids.length === 1 ? "" : "s"}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
