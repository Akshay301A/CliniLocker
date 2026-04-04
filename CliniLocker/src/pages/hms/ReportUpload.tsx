import React from "react";

export default function ReportUpload() {
  return (
    <div className="text-on-surface">
      {/* SideNavBar Shell */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f6f3f5] dark:bg-slate-900 flex flex-col p-4 space-y-2 z-40 hidden md:flex">
        <div className="mb-8 px-2 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-[#1b1b1d] dark:text-white leading-none">CliniLocker</h1>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold mt-1">Medical Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 ease-in-out" href="/hms/dashboard">
            <span className="material-symbols-outlined">dashboard</span> Dashboard
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide bg-white dark:bg-slate-800 text-[#0058bc] dark:text-white rounded-lg shadow-sm" href="/hms/patients/new">
            <span className="material-symbols-outlined">group</span> Patients
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 ease-in-out" href="/hms/visits/new">
            <span className="material-symbols-outlined">calendar_today</span> Visits
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 ease-in-out" href="/hms/billing">
            <span className="material-symbols-outlined">receipt_long</span> Billing
          </a>
        </nav>
        <div className="pt-4 mt-4 border-t border-outline-variant/10 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 ease-in-out" href="/hms/dashboard">
            <span className="material-symbols-outlined">settings</span> Settings
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium tracking-wide text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] dark:hover:bg-slate-800/50 transition-all duration-200 ease-in-out" href="/hms/dashboard">
            <span className="material-symbols-outlined">help</span> Support
          </a>
        </div>
        <div className="mt-6">
          <a className="w-full py-3 px-4 bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95" href="/hms/patients/new">
            <span className="material-symbols-outlined text-sm">add</span> Add New Patient
          </a>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen flex flex-col">
        {/* TopNavBar Shell */}
        <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3 bg-[#fcf8fb]/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden p-2 text-on-surface">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">search</span>
              <input className="w-full bg-[#f6f3f5] border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search patients or records..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-[#f6f3f5] rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant/20">
              <img alt="Doctor Profile" className="w-full h-full object-cover" data-alt="Professional portrait of a middle-aged doctor in a white coat with a friendly expression in a bright clinic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMvf2ANaUsYPR8wBW-D3LIsg-8DHoG0NzIjVlbBdCX99UA4UmlPn0TPFQya5bChjwPvD1y0sS17GXquydsNm_Wtuc_IvK7bgGc3_WXSFEmt4nGzyJWQ6JE29juj7iDAPwiefTNzelbBVpeClb3Tn45-ejof6eyP665beZYF1GeD6fS953ikql3aTLrq9q4WpagmzarKs6FLluyc1qZ1G6V0lw_OXrdXh4l-zWxyzKHBAODVuVnfqUKs-6vSokVu6b7osiqzsdMso4" />
            </div>
          </div>
        </header>
        {/* Content Canvas */}
        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <nav className="flex items-center gap-2 text-xs font-semibold text-primary mb-2 tracking-wider">
                <span className="uppercase">Patients</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="uppercase">P-2026-001</span>
              </nav>
              <h2 className="text-3xl font-bold tracking-tight text-on-surface">Upload Reports - John Doe</h2>
              <p className="text-on-surface-variant/70 mt-1 font-medium italic">Case ID: P-2026-001 • Cardiology Department</p>
            </div>
            <div className="flex items-center gap-3">
              <a className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-colors" href="/hms/patients/1">
                View Records
              </a>
              <a className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#0058bc] to-[#0070eb] text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2" href="/hms/patients/1">
                <span className="material-symbols-outlined text-[20px]">link</span>
                Attach to Patient
              </a>
            </div>
          </div>
          {/* Bento Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Upload Zone */}
            <div className="lg:col-span-7 space-y-8">
              <section className="bg-surface-container-lowest rounded-3xl p-1 border border-outline-variant/10 shadow-sm overflow-hidden">
                <div className="m-2 rounded-[22px] border-2 border-dashed border-primary/20 bg-primary/5 p-12 text-center transition-all hover:bg-primary/[0.08] group cursor-pointer">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Drop your medical reports here</h3>
                  <p className="text-on-surface-variant/60 text-sm max-w-xs mx-auto mb-8">Support for high-res PDF, JPEG, and DICOM formats. Max file size 50MB.</p>
                  <button className="px-8 py-3 bg-white text-primary rounded-full font-bold text-sm shadow-sm border border-outline-variant/20 hover:shadow-md transition-all">
                    Browse Files
                  </button>
                </div>
              </section>
              {/* Status / Details Area */}
              <div className="bg-surface-container-low rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Storage Insights</h4>
                  <span className="text-xs font-bold text-primary">72% Full</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[72%] rounded-full"></div>
                </div>
                <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
                  John Doe's digital locker has used <strong>1.2 GB</strong> of the allocated 2GB. Large imaging files (MRI/CT scans) are automatically optimized for web preview.
                </p>
              </div>
            </div>
            {/* Right: Recent Uploads */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-on-surface">Recent Uploads</h3>
                  <a className="text-xs font-bold text-primary hover:underline cursor-pointer" href="/hms/reports">View All</a>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-surface-container-low transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-error">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">Blood_Work_Q3.pdf</h4>
                      <p className="text-[11px] font-medium text-on-surface-variant/60">Oct 24, 2023 • 2.4 MB</p>
                    </div>
                    <a className="p-2 text-on-surface-variant/40 hover:text-primary transition-colors" href="/hms/reports">
                      <span className="material-symbols-outlined">download</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-surface-container-low transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">Chest_XRay_Lateral.jpg</h4>
                      <p className="text-[11px] font-medium text-on-surface-variant/60">Oct 22, 2023 • 15.1 MB</p>
                    </div>
                    <a className="p-2 text-on-surface-variant/40 hover:text-primary transition-colors" href="/hms/reports">
                      <span className="material-symbols-outlined">download</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-surface-container-low transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">Lab_Referral_Form.docx</h4>
                      <p className="text-[11px] font-medium text-on-surface-variant/60">Oct 20, 2023 • 450 KB</p>
                    </div>
                    <a className="p-2 text-on-surface-variant/40 hover:text-primary transition-colors" href="/hms/reports">
                      <span className="material-symbols-outlined">download</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-surface-container-low transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-error">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">Cardio_Report_Final.pdf</h4>
                      <p className="text-[11px] font-medium text-on-surface-variant/60">Oct 18, 2023 • 5.8 MB</p>
                    </div>
                    <a className="p-2 text-on-surface-variant/40 hover:text-primary transition-colors" href="/hms/reports">
                      <span className="material-symbols-outlined">download</span>
                    </a>
                  </div>
                </div>
              </div>
              {/* Security Badge */}
              <div className="bg-gradient-to-br from-on-surface to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">HIPAA Compliant</h4>
                  <p className="text-white/60 text-xs leading-relaxed">All files are encrypted with AES-256 before being stored in the CliniLocker vault.</p>
                </div>
                <div className="absolute -right-12 -bottom-12 opacity-10">
                  <span className="material-symbols-outlined text-[180px]">security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* BottomNavBar Shell (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl md:hidden flex justify-around items-center px-4 py-3 border-t border-outline-variant/10 z-50">
        <a className="flex flex-col items-center gap-1 text-on-surface-variant/60" href="/hms/dashboard">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-primary" href="/hms/patients/new">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          <span className="text-[10px] font-bold uppercase">Patients</span>
        </a>
        <div className="relative -top-6">
          <button className="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant/60" href="/hms/visits/new">
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="text-[10px] font-bold uppercase">Visits</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant/60" href="/hms/dashboard">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </a>
      </nav>
    </div>
  );
}
