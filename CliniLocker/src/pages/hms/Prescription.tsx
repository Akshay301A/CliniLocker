import React from "react";

export default function Prescription() {
  return (
    <div className="text-on-surface antialiased">
      {/* SideNavBar (Authority Source: JSON) */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f6f3f5] dark:bg-slate-900 flex flex-col p-4 space-y-2 z-[60]">
        <div className="flex flex-col mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined">health_metrics</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-[#1b1b1d] dark:text-white leading-none">CliniLocker</h1>
              <p className="text-[10px] font-medium tracking-widest uppercase text-[#1b1b1d]/40">Medical Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] transition-all duration-200 ease-in-out group" href="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span className="font-['Inter'] text-sm font-medium tracking-wide">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 text-[#0058bc] dark:text-white rounded-lg shadow-sm transition-all duration-200 ease-in-out" href="/hms/patients/1">
            <span className="material-symbols-outlined" data-icon="group">group</span>
            <span className="font-['Inter'] text-sm font-medium tracking-wide">Patients</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] transition-all duration-200 ease-in-out" href="/hms/visits/new">
            <span className="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
            <span className="font-['Inter'] text-sm font-medium tracking-wide">Visits</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] transition-all duration-200 ease-in-out" href="/hms/billing">
            <span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
            <span className="font-['Inter'] text-sm font-medium tracking-wide">Billing</span>
          </a>
        </nav>
        <div className="pt-4 border-t border-[#1b1b1d]/5 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] transition-all duration-200 ease-in-out" href="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span className="font-['Inter'] text-sm font-medium tracking-wide">Settings</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] transition-all duration-200 ease-in-out" href="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="help">help</span>
            <span className="font-['Inter'] text-sm font-medium tracking-wide">Support</span>
          </a>
        </div>
      </aside>
      {/* TopNavBar (Authority Source: JSON) */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-[#fcf8fb]/80 dark:bg-slate-950/80 backdrop-blur-xl z-50 flex justify-between items-center px-8 shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl" data-icon="search">search</span>
            <input className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search patients or records..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="relative p-2 text-on-surface-variant hover:bg-[#f6f3f5] rounded-full transition-colors">
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-surface-container-high">
            <div className="text-right">
              <p className="text-sm font-bold text-on-surface leading-none">Dr. Adrian Vance</p>
              <p className="text-[11px] text-on-surface-variant mt-1">Chief Cardiologist</p>
            </div>
            <img alt="Doctor Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" data-alt="Professional portrait of a male doctor in clinical attire with a warm and focused expression" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNPJ7QURSFH_FyGj4liSce1oa4aRqxJdq0kd6o5SKcF4-ff_pKrKNv_oTIx3mp-NNaSuB9TiMLyjXFxPqpc-39vQv9hiT7zJ-ZqqDpvP6EF4GXjzec0yiSvYynwo__khMCnb43hA_urSYViT0rlc-0ebLNywaGf0YynNvPkcDfQHunaiLZ_Ru2bqRwYPr1IJi2w5xIKjtQh55r2axdrPmvG0fcyS4RxUcoCV8NQsHkT0jYpDIrIaoTLteZpyQJko3kz-WHPFF00RA" />
          </div>
        </div>
      </header>
      {/* Main Content Canvas */}
      <main className="ml-64 pt-24 pb-20 px-8 min-h-screen">
        <div className="writing-canvas">
          {/* Breadcrumbs / Status */}
          <div className="flex items-center gap-2 mb-6 text-on-surface-variant/60">
            <a className="material-symbols-outlined text-base" data-icon="arrow_back" href="/hms/visits/new">arrow_back</a>
            <span className="text-xs font-semibold tracking-wider uppercase">Active Encounter</span>
            <span className="mx-1">•</span>
            <span className="text-xs font-medium">Auto-saved at 14:22 PM</span>
          </div>
          {/* Page Header */}
          <div className="mb-12">
            <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">Prescription - John Doe (P-2026-001)</h2>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg" data-icon="calendar_today">calendar_today</span>
                <span className="text-sm font-medium">May 24, 2024</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg" data-icon="fingerprint">fingerprint</span>
                <span className="text-sm font-medium">ID: RE-88219</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">Urgent Follow-up</span>
            </div>
          </div>
          {/* Writing Section: Symptoms & Diagnosis */}
          <section className="grid grid-cols-1 gap-10 mb-12">
            <div className="group">
              <label className="block text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.1em] mb-3 group-focus-within:text-primary transition-colors">Chief Symptoms &amp; Observations</label>
              <textarea className="w-full bg-transparent border-none p-0 text-xl font-medium leading-relaxed placeholder:text-on-surface-variant/20 focus:ring-0 resize-none min-h-[120px] no-scrollbar" placeholder="Start typing symptoms (e.g. Sharp pain in lower abdomen, persistent cough for 3 days)..."></textarea>
            </div>
            <div className="group">
              <label className="block text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.1em] mb-3 group-focus-within:text-primary transition-colors">Clinical Diagnosis</label>
              <textarea className="w-full bg-transparent border-none p-0 text-xl font-medium leading-relaxed placeholder:text-on-surface-variant/20 focus:ring-0 resize-none min-h-[120px] no-scrollbar" placeholder="Enter clinical assessment or diagnostic codes..."></textarea>
            </div>
          </section>
          {/* Medicines Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold tracking-tight text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-icon="medication">medication</span>
                Medications &amp; Regimen
              </h3>
              <button className="flex items-center gap-2 text-primary font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined" data-icon="add">add</span>
                Add Medicine
              </button>
            </div>
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 border-b border-on-surface-variant/5">
                    <th className="px-6 py-4 font-bold">Medicine Name</th>
                    <th className="px-6 py-4 font-bold">Dosage</th>
                    <th className="px-6 py-4 font-bold">Frequency</th>
                    <th className="px-6 py-4 font-bold">Duration</th>
                    <th className="px-6 py-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-on-surface-variant/5">
                  <tr className="group hover:bg-surface-container transition-colors">
                    <td className="px-6 py-5">
                      <input className="bg-transparent border-none p-0 text-sm font-semibold w-full focus:ring-0" type="text" value="Amoxicillin 500mg" />
                    </td>
                    <td className="px-6 py-5">
                      <input className="bg-transparent border-none p-0 text-sm w-full focus:ring-0" type="text" value="1 Capsule" />
                    </td>
                    <td className="px-6 py-5">
                      <select className="bg-transparent border-none p-0 text-sm w-full focus:ring-0">
                        <option>Twice Daily (BD)</option>
                        <option>Once Daily (OD)</option>
                        <option>Thrice Daily (TDS)</option>
                        <option>As Needed (PRN)</option>
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <input className="bg-transparent border-none p-0 text-sm w-full focus:ring-0" type="text" value="7 Days" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-on-surface-variant/40 hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-xl" data-icon="delete">delete</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="group hover:bg-surface-container transition-colors">
                    <td className="px-6 py-5">
                      <input className="bg-transparent border-none p-0 text-sm font-semibold w-full focus:ring-0" type="text" value="Paracetamol 650mg" />
                    </td>
                    <td className="px-6 py-5">
                      <input className="bg-transparent border-none p-0 text-sm w-full focus:ring-0" type="text" value="1 Tablet" />
                    </td>
                    <td className="px-6 py-5">
                      <select className="bg-transparent border-none p-0 text-sm w-full focus:ring-0" defaultValue="As Needed (PRN)">
                        <option>As Needed (PRN)</option>
                        <option>Twice Daily (BD)</option>
                        <option>Once Daily (OD)</option>
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <input className="bg-transparent border-none p-0 text-sm w-full focus:ring-0" type="text" value="3 Days" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-on-surface-variant/40 hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-xl" data-icon="delete">delete</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          {/* Instructions & Notes */}
          <section className="mb-16">
            <div className="bg-surface-container-lowest p-8 rounded-xl border-2 border-dashed border-surface-container-high">
              <label className="block text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.1em] mb-4">Patient Instructions / Dietary Advice</label>
              <textarea className="w-full bg-transparent border-none p-0 text-sm font-medium leading-relaxed placeholder:text-on-surface-variant/30 focus:ring-0 resize-none min-h-[80px]" placeholder="Add specific instructions (e.g., Take with warm water, avoid dairy products for 4 hours after dose)..."></textarea>
            </div>
          </section>
          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-surface-container-high">
            <div className="flex items-center gap-6">
              <a className="flex items-center gap-2 text-on-surface-variant font-bold text-sm hover:text-primary transition-colors" href="/hms/reports">
                <span className="material-symbols-outlined" data-icon="cloud_upload">cloud_upload</span>
                Attach Lab Reports
              </a>
              <a className="flex items-center gap-2 text-on-surface-variant font-bold text-sm hover:text-primary transition-colors" href="/hms/patients/1">
                <span className="material-symbols-outlined" data-icon="history">history</span>
                View History
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a className="px-6 py-3 rounded-xl text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-colors" href="/hms/dashboard">
                Save as Draft
              </a>
              <a className="px-8 py-3 rounded-xl bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all" href="/hms/patients/1">
                <span className="material-symbols-outlined text-lg" data-icon="description">description</span>
                Save &amp; Generate Prescription
              </a>
            </div>
          </div>
        </div>
      </main>
      {/* Contextual FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group">
        <span className="material-symbols-outlined text-2xl" data-icon="chat_bubble">chat_bubble</span>
        <span className="absolute right-16 bg-on-surface text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AI Clinical Assistant</span>
      </button>
    </div>
  );
}
