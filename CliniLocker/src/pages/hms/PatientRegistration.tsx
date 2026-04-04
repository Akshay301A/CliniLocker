import React from "react";
import { Link } from "react-router-dom";

export default function PatientRegistration() {
  return (
    <div className="bg-surface text-on-surface">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f6f3f5] dark:bg-slate-900 flex flex-col p-4 space-y-2 z-40 hidden md:flex">
        <div className="px-3 py-6 flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-lg" data-icon="medical_services">medical_services</span>
            </div>
            <span className="text-lg font-black text-[#1b1b1d] dark:text-white leading-none">CliniLocker</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#1b1b1d]/40 dark:text-slate-500 pl-11">Medical Management</span>
        </div>
        <nav className="flex-1 space-y-1">
          <Link className="flex items-center gap-3 px-4 py-2.5 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 ease-in-out font-['Inter'] text-sm font-medium tracking-wide" to="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 text-[#0058bc] dark:text-white rounded-lg shadow-sm font-['Inter'] text-sm font-medium tracking-wide" to="/hms/patients/new">
            <span className="material-symbols-outlined" data-icon="group" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <span>Patients</span>
          </Link>
          <Link className="flex items-center gap-3 px-4 py-2.5 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 ease-in-out font-['Inter'] text-sm font-medium tracking-wide" to="/hms/visits/new">
            <span className="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
            <span>Visits</span>
          </Link>
          <Link className="flex items-center gap-3 px-4 py-2.5 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 ease-in-out font-['Inter'] text-sm font-medium tracking-wide" to="/hms/billing">
            <span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
            <span>Billing</span>
          </Link>
        </nav>
        <div className="mt-auto space-y-1 border-t border-on-surface-variant/10 pt-4">
          <Link className="flex items-center gap-3 px-4 py-2.5 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 ease-in-out font-['Inter'] text-sm font-medium tracking-wide" to="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span>Settings</span>
          </Link>
          <Link className="flex items-center gap-3 px-4 py-2.5 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 ease-in-out font-['Inter'] text-sm font-medium tracking-wide" to="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="help">help</span>
            <span>Support</span>
          </Link>
        </div>
      </aside>
      {/* Main Content Wrapper */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        {/* TopNavBar */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-[#fcf8fb]/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] flex justify-between items-center w-full px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tighter text-[#1b1b1d] dark:text-white font-['Inter']">Register New Patient</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-surface-container-low px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-on-surface-variant text-xl mr-2" data-icon="search">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-on-surface-variant/50 w-48" placeholder="Search patients..." type="text" />
            </div>
            <button className="p-2 text-[#1b1b1d]/60 hover:bg-[#f6f3f5] rounded-full transition-colors">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20">
              <img alt="Doctor Profile" className="w-full h-full object-cover" data-alt="close-up portrait of a professional male doctor in clinical attire with soft natural lighting and medical office background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxTvJm8mAHYrm8etSk1obKoP9dhhwGNe2Vut-JcHDWdIiMSpxAc5M24XJSdWA4Zj9tPd7ROnSTTXdI5ChWZwXRGRW273WMNpQoOnGBxPMWYei7QbCH_VhMsE1lqARR4VSbbl5lJinmNRREKvaiHcvQvvHOquFShyN26oHCrJNMLw4bhsjE88vx1QKT2edTEuZFkP5fexZLA_y9u_6S5slmTKZI05qhmYwWh75K6csFG2b_ed6yAhs8j_JrqxDz-Dpa37Hk5adFuMw" />
            </div>
          </div>
        </header>
        {/* Content Canvas */}
        <main className="mt-20 p-6 md:p-12 flex-1 max-w-5xl mx-auto w-full">
          {/* Patient ID Banner (Tonal Architecture) */}
          <div className="mb-12 bg-surface-container-low p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.1em] font-bold text-primary font-label">System Assigned Identification</p>
              <h2 className="text-3xl font-bold tracking-tight text-on-surface -ml-0.5">Patient ID: P-2026-001</h2>
              <p className="text-on-surface-variant text-sm max-w-md">This unique identifier is automatically generated for tracking medical history across the CliniLocker network.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center gap-3">
              <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <span className="material-symbols-outlined text-4xl mb-2" data-icon="qr_code_2">qr_code_2</span>
                <span className="text-[10px] font-bold uppercase leading-tight">Auto-generated QR Code</span>
              </div>
            </div>
          </div>
          {/* Registration Form (Stripe-inspired clean white card) */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] overflow-hidden">
            <div className="px-8 py-6 border-b border-on-surface-variant/5">
              <h3 className="text-lg font-semibold text-on-surface">Personal Information</h3>
            </div>
            <form className="p-8 space-y-10">
              {/* Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 font-label" htmlFor="full_name">Full Legal Name</label>
                  <input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-body-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-on-surface-variant/30" id="full_name" placeholder="e.g. Johnathan Doe" type="text" />
                </div>
                {/* Phone Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 font-label" htmlFor="phone">Phone Number</label>
                  <div className="flex">
                    <select className="inline-flex items-center px-4 rounded-l-xl border-r-0 bg-surface-container-high text-on-surface-variant text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none cursor-pointer" defaultValue="+91">
                      <option value="+91">+91 IN</option>
                      <option value="+1">+1 US</option>
                      <option value="+44">+44 UK</option>
                      <option value="+61">+61 AU</option>
                      <option value="+971">+971 UAE</option>
                    </select>
                    <input className="flex-1 bg-surface-container-low border-none rounded-r-xl px-4 py-3 text-body-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-on-surface-variant/30" id="phone" placeholder="98765 43210" type="tel" />
                  </div>
                </div>
                {/* Age Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 font-label" htmlFor="age">Age (Years)</label>
                  <input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-body-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-on-surface-variant/30" id="age" placeholder="00" type="number" />
                </div>
                {/* Gender Dropdown */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 font-label" htmlFor="gender">Gender</label>
                  <div className="relative">
                    <select className="w-full bg-surface-container-low border-none appearance-none rounded-xl px-4 py-3 text-body-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none pr-10 cursor-pointer" id="gender">
                      <option disabled value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Non-binary</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" data-icon="expand_more">expand_more</span>
                  </div>
                </div>
              </div>
              {/* Asymmetrical layout detail: Additional clinical note */}
              <div className="pt-8 border-t border-on-surface-variant/5">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5">
                  <span className="material-symbols-outlined text-primary mt-0.5" data-icon="info">info</span>
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Administrative Note</p>
                    <p className="text-xs text-primary/70 leading-relaxed">Ensure all identification matches the patient's legal documents. Insurance details can be added in the next stage of onboarding from the Patient Profile page.</p>
                  </div>
                </div>
              </div>
              {/* CTA Section */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
                <a className="w-full sm:w-auto px-8 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl text-center" href="/hms/dashboard">
                  Cancel
                </a>
                <a className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-[#0058bc] to-[#0070eb] text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/10 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2" href="/hms/patients/1">
                  <span className="material-symbols-outlined text-lg" data-icon="save" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                  Save Patient
                </a>
              </div>
            </form>
          </div>
          {/* Bottom Spacer for visual breathing room */}
          <div className="h-24"></div>
        </main>
      </div>
      {/* Mobile BottomNavBar (Strictly hidden on desktop as per Pivot Rule) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#fcf8fb]/90 backdrop-blur-lg flex justify-around items-center py-3 px-6 z-50 shadow-[0px_-4px_24px_rgba(0,88,188,0.04)]">
        <Link className="flex flex-col items-center gap-1 text-[#1b1b1d]/60" to="/hms/dashboard">
          <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-[#0058bc] font-semibold" to="/hms/patients/new">
          <span className="material-symbols-outlined" data-icon="group" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          <span className="text-[10px]">Patients</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-[#1b1b1d]/60" to="/hms/visits/new">
          <span className="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
          <span className="text-[10px]">Visits</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-[#1b1b1d]/60" to="/hms/billing">
          <span className="material-symbols-outlined" data-icon="receipt_long">payment</span>
          <span className="text-[10px]">Billing</span>
        </Link>
      </nav>
    </div>
  );
}
