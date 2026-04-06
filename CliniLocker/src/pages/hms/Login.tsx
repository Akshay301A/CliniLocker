import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const HmsLogin = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-on-surface">
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#0B57D0] via-[#1E6DE0] to-[#3BA9FF] p-10 text-white shadow-[0px_20px_60px_rgba(5,88,188,0.35)]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      local_hospital
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-white/80">CliniLocker</p>
                    <h1 className="text-2xl font-extrabold tracking-tight">HMS</h1>
                  </div>
                </div>
                <h2 className="mt-10 text-3xl font-extrabold leading-tight">
                  A modern HMS for clinics and small hospitals
                </h2>
                <p className="mt-4 text-white/80 leading-relaxed">
                  Fast patient flow, secure records, and paperless visits. Built for receptionists, doctors, and owners.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  { icon: "bolt", title: "10 minute setup", desc: "Start working immediately" },
                  { icon: "group", title: "Team friendly", desc: "Simple for non-technical staff" },
                  { icon: "shield", title: "Secure by default", desc: "Protected patient data" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-white/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-[0px_16px_50px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-2xl bg-[#EDF3FF] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0B57D0] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                </div>
                <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">CliniLocker HMS</h1>
                <p className="mt-2 text-sm text-slate-500">Clinical Precision and Data Security</p>
              </div>

              <form className="mt-8 space-y-6">
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
                    Email Address
                  </label>
                  <input
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B57D0]/30 focus:border-[#0B57D0]/40 text-slate-900 transition-all"
                    placeholder="doctor@clinilocker.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B57D0]/30 focus:border-[#0B57D0]/40 text-slate-900 transition-all pr-12"
                      placeholder="********"
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
                    Role Selector
                  </label>
                  <div className="relative">
                    <select className="w-full appearance-none px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B57D0]/30 focus:border-[#0B57D0]/40 text-slate-900 transition-all cursor-pointer">
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400">expand_more</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <a
                    href="/hms/dashboard"
                    className="w-full bg-gradient-to-br from-[#0B57D0] to-[#1E6DE0] text-white font-bold py-4 rounded-xl shadow-[0px_10px_20px_rgba(11,87,208,0.25)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  >
                    <span>Login</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </a>
                </div>
                <div className="pt-2 text-center">
                  <a className="text-[#0B57D0] text-sm font-semibold hover:opacity-80 transition-colors" href="/hms/login">
                    Forgot Password?
                  </a>
                </div>
              </form>

              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="flex items-center gap-6 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">verified_user</span>
                    <span className="text-[11px] font-semibold tracking-tight">HIPAA Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">shield</span>
                    <span className="text-[11px] font-semibold tracking-tight">256-bit Encrypted</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Powered by CliniLocker HMS</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HmsLogin;
