import { useState } from "react";
import { Link } from "react-router-dom";

const HmsLogin = () => {
  const [role, setRole] = useState("doctor");

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      <main className="flex-grow flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center mb-6 shadow-[0px_12px_32px_rgba(0,88,188,0.12)]">
              <span className="text-white text-3xl font-black">H</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">
              CliniLocker HMS
            </h1>
            <p className="text-on-surface-variant font-medium tracking-tight">
              Clinical Precision & Data Security
            </p>
          </div>

          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
            <form className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-2 ml-1">
                  Email Address
                </label>
                <input
                  className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-on-surface transition-all"
                  placeholder="doctor@clinilocker.com"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-2 ml-1">
                  Password
                </label>
                <input
                  className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-on-surface transition-all"
                  placeholder="••••••••••••"
                  type="password"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-2 ml-1">
                  Role Selector
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-on-surface transition-all cursor-pointer"
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="pt-2">
                <Link
                  to="/hms/dashboard"
                  className="w-full tonal-gradient-btn text-white font-bold py-4 rounded-xl shadow-[0px_8px_16px_rgba(0,88,188,0.2)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <span>Login</span>
                  <span>→</span>
                </Link>
              </div>
              <div className="pt-4 text-center">
                <a className="text-primary text-sm font-semibold hover:text-primary-container transition-colors tracking-tight" href="#">
                  Forgot Password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HmsLogin;

