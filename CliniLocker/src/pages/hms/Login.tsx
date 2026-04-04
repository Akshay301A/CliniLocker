const HmsLogin = () => {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col asymmetric-bg">
      <main className="flex-grow flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center mb-12">
            <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center mb-6 shadow-[0px_12px_32px_rgba(0,88,188,0.12)]">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">CliniLocker</h1>
            <p className="text-on-surface-variant font-medium tracking-tight">Clinical Precision & Data Security</p>
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
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">
                    Password
                  </label>
                </div>
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
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-on-surface transition-all cursor-pointer">
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="/hms/dashboard"
                  className="w-full tonal-gradient-btn text-white font-bold py-4 rounded-xl shadow-[0px_8px_16px_rgba(0,88,188,0.2)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <span>Login</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </a>
              </div>
              <div className="pt-4 text-center">
                <a className="text-primary text-sm font-semibold hover:text-primary-container transition-colors tracking-tight" href="/hms/login">
                  Forgot Password?
                </a>
              </div>
            </form>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-on-surface-variant/40">
                <span className="material-symbols-outlined text-lg">verified_user</span>
                <span className="text-[12px] font-medium tracking-tight">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant/40">
                <span className="material-symbols-outlined text-lg">shield</span>
                <span className="text-[12px] font-medium tracking-tight">256-bit Encrypted</span>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Powered by CliniLocker HMS</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HmsLogin;
