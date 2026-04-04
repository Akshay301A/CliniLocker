import React from "react";

export default function NewVisit() {
  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* SideNavBar */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 flex-col p-4 space-y-2 bg-[#f6f3f5] dark:bg-slate-900 z-50">
        <div className="flex items-center space-x-3 px-2 py-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-[#1b1b1d] dark:text-white leading-none">CliniLocker</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Medical Management</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center space-x-3 px-4 py-3 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 rounded-xl" href="/hms/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-medium text-sm">Dashboard</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 rounded-xl" href="/hms/patients/new">
            <span className="material-symbols-outlined">group</span>
            <span className="font-medium text-sm">Patients</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 bg-white dark:bg-slate-800 text-[#0058bc] dark:text-white rounded-xl shadow-sm transition-all duration-200" href="/hms/visits/new">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            <span className="font-medium text-sm">Visits</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 rounded-xl" href="/hms/billing">
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="font-medium text-sm">Billing</span>
          </a>
        </nav>
        <div className="pt-4 border-t border-outline-variant/10 space-y-1">
          <a className="flex items-center space-x-3 px-4 py-3 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 rounded-xl" href="/hms/dashboard">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-medium text-sm">Settings</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 rounded-xl" href="/hms/dashboard">
            <span className="material-symbols-outlined">help</span>
            <span className="font-medium text-sm">Support</span>
          </a>
        </div>
      </aside>
      {/* Main Content Wrapper */}
      <main className="md:ml-64 min-h-screen transition-all duration-300">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 bg-[#fcf8fb]/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] px-6 py-3 flex justify-between items-center w-full">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search anything..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-[#f6f3f5] dark:hover:bg-slate-800 transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-px bg-outline-variant/20 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface leading-tight">Dr. Julianne Moore</p>
                <p className="text-[10px] text-on-surface-variant font-medium">Senior Cardiologist</p>
              </div>
              <img alt="Doctor Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10" data-alt="professional portrait of a confident female doctor with dark hair in clinical attire, soft studio lighting, medical background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeviFuabvDQtsrxEvwubOA2_o5tqGSmDHEoNZC5OFZsNu1M-M7SlYqKvgI9-MMt7qndsJ3RECR3g4eapKuK7MpXlQTucj0D1KuXySNbCdYvaYFDICKpg2mlRE4Oy41oKYTwzoNWvrPAB3uQ1jKuL-8w0cW6c5K6pohBRQDoMOa33sCniVFAzeH67b3UsSxtNQvSRgbO1ykJ3HTLzyIqCgp5fay8899O6EQcFSEH8KdMcmHCUcKm9VOr1ZkjbW5YZkxi6najZCoov8" />
            </div>
          </div>
        </header>
        {/* Page Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Breadcrumbs / Context */}
          <nav className="flex items-center gap-2 mb-8 text-sm font-medium text-on-surface-variant/60">
            <a className="hover:text-primary" href="/hms/visits/new">Visits</a>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface">New Visit</span>
          </nav>
          <header className="mb-12">
            <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">New Visit</h2>
            <p className="text-on-surface-variant max-w-md">Create a new clinical session. All information entered here is strictly confidential.</p>
          </header>
          {/* Notion-inspired Form Card */}
          <div className="bg-surface-container-lowest rounded-xl p-0 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
            <form className="divide-y divide-surface-container">
              {/* Patient Selection Row */}
              <div className="group px-8 py-6 hover:bg-surface-container-low/30 transition-colors">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">Patient Search / Selection</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-primary">person_search</span>
                  <input className="w-full bg-transparent border-none p-0 pl-8 text-lg font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0" placeholder="Search by name or ID..." type="text" value="John Doe - P-2026-001" />
                </div>
              </div>
              {/* Auto-filled Details Row (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-surface-container">
                <div className="group px-8 py-6 hover:bg-surface-container-low/30 transition-colors">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">Consultation Date</label>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span>
                    <input className="w-full bg-transparent border-none p-0 text-body-lg font-medium text-on-surface focus:ring-0 cursor-default" readOnly type="text" value="Oct 24, 2023" />
                  </div>
                </div>
                <div className="group px-8 py-6 hover:bg-surface-container-low/30 transition-colors">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">Check-in Time</label>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                    <input className="w-full bg-transparent border-none p-0 text-body-lg font-medium text-on-surface focus:ring-0 cursor-default" readOnly type="text" value="10:30 AM" />
                  </div>
                </div>
              </div>
              {/* Assign Doctor Row */}
              <div className="group px-8 py-6 hover:bg-surface-container-low/30 transition-colors">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">Assign Doctor</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant">stethoscope</span>
                  <select className="w-full bg-transparent border-none p-0 pl-8 text-body-lg font-medium text-on-surface focus:ring-0 appearance-none cursor-pointer">
                    <option>Dr. Julianne Moore (Cardiology)</option>
                    <option>Dr. Alan Grant (Orthopedics)</option>
                    <option>Dr. Sarah Harding (Pediatrics)</option>
                    <option>Dr. Ian Malcolm (Neurology)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-0 pointer-events-none text-on-surface-variant/50">unfold_more</span>
                </div>
              </div>
              {/* Visit Type / Notes */}
              <div className="group px-8 py-6 hover:bg-surface-container-low/30 transition-colors">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">Brief Reason for Visit</label>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant mt-1">notes</span>
                  <textarea className="w-full bg-transparent border-none p-0 text-body-lg font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 resize-none" placeholder="Add a quick note about symptoms or purpose..." rows={3}></textarea>
                </div>
              </div>
              {/* CTA Row */}
              <div className="px-8 py-8 bg-surface-container-low/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="text-xs font-medium">HIPAA Compliant Session</span>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <a className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors text-center" href="/hms/dashboard">
                    Save as Draft
                  </a>
                  <a className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-3 bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white rounded-xl shadow-[0px_8px_20px_rgba(0,88,188,0.25)] hover:shadow-[0px_12px_24px_rgba(0,88,188,0.35)] active:scale-[0.98] transition-all group" href="/hms/prescriptions/new">
                    <span className="font-bold">Start Consultation</span>
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </a>
                </div>
              </div>
            </form>
          </div>
          {/* Footer Meta */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex gap-8">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest">Operator</p>
                <p className="text-xs">Clerk-992</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest">System Load</p>
                <p className="text-xs">Optimal (14ms)</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest">Backup</p>
                <p className="text-xs">Live Sync</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
              Secure Medical Environment
            </div>
          </div>
        </div>
      </main>
      {/* Mobile Bottom NavBar (Visible only on mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#fcf8fb]/90 backdrop-blur-xl border-t border-outline-variant/10 px-4 py-2 z-50 flex justify-around items-center">
        <a className="flex flex-col items-center p-2 text-[#1b1b1d]/60" href="/hms/dashboard">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold mt-1">Home</span>
        </a>
        <a className="flex flex-col items-center p-2 text-[#1b1b1d]/60" href="/hms/patients/new">
          <span className="material-symbols-outlined">group</span>
          <span className="text-[10px] font-bold mt-1">Patients</span>
        </a>
        <div className="relative -top-6">
          <button className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>
        <a className="flex flex-col items-center p-2 text-[#0058bc]" href="/hms/visits/new">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
          <span className="text-[10px] font-bold mt-1">Visits</span>
        </a>
        <a className="flex flex-col items-center p-2 text-[#1b1b1d]/60" href="/hms/patients/1">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="text-[10px] font-bold mt-1">Profile</span>
        </a>
      </div>
    </div>
  );
}
