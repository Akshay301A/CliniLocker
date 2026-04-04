import React from "react";

export default function Billing() {
  return (
    <div className="bg-surface text-on-surface">
      {/* SideNavBar Shell */}
      <aside className="h-screen w-64 fixed left-0 top-0 tonal-architecture flex flex-col h-full p-4 space-y-2 z-40 hidden md:flex">
        <div className="px-2 py-4 mb-6">
          <h1 className="text-lg font-black text-[#1b1b1d] dark:text-white leading-tight">CliniLocker</h1>
          <p className="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant font-bold opacity-70">Medical Management</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg" href="/hms/dashboard">
            <span className="material-symbols-outlined mr-3" data-icon="dashboard">dashboard</span> Dashboard
          </a>
          <a className="flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg" href="/hms/patients/new">
            <span className="material-symbols-outlined mr-3" data-icon="group">group</span> Patients
          </a>
          <a className="flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg" href="/hms/visits/new">
            <span className="material-symbols-outlined mr-3" data-icon="calendar_today">calendar_today</span> Visits
          </a>
          <a className="flex items-center px-3 py-2 text-sm font-semibold transition-all duration-200 ease-in-out bg-white text-[#0058bc] rounded-lg shadow-sm" href="/hms/billing">
            <span className="material-symbols-outlined mr-3" data-icon="receipt_long">receipt_long</span> Billing
          </a>
        </nav>
        <div className="mt-auto pt-6 border-t border-outline-variant/10 space-y-1">
          <a className="flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg" href="/hms/dashboard">
            <span className="material-symbols-outlined mr-3" data-icon="settings">settings</span> Settings
          </a>
          <a className="flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg" href="/hms/dashboard">
            <span className="material-symbols-outlined mr-3" data-icon="help">help</span> Support
          </a>
        </div>
      </aside>
      {/* TopNavBar Shell */}
      <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-[#fcf8fb]/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-low px-4 py-1.5 rounded-full flex items-center gap-2 group transition-all duration-200 hover:bg-white border border-outline-variant/20">
            <span className="material-symbols-outlined text-sm text-on-surface-variant" data-icon="search">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm p-0 w-48 text-on-surface" placeholder="Search patients..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl transition-transform active:opacity-80 scale-95 hover:shadow-lg hover:shadow-primary/20" href="/hms/patients/new">
            Add New Patient
          </a>
          <div className="w-px h-6 bg-outline-variant/30"></div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="notifications">notifications</button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30">
            <img className="w-full h-full object-cover" data-alt="Close up portrait of a professional male doctor with glasses and a white medical coat in a bright office" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy7wnIHn_4HQ5zq97DD6q4V1WMzBNns1SknefOEDBsohEf8QtfP12eQbHQsKTXxepqQ4-l6qy23DSGDe3SHiIYeogMn7c7bSthVbLDESLf0o36Vhc6U6B_lGWCYyG4L7Y218Z5tmu5N1lSw7gl-k-oZ_ZOKA3a3_Ru5eFiyHrk1IyZ4aZIpTdjpkQKZZZaxKcZNbHDBlGR-4NhH9HpaJBtpX-h8uGVStDeE5a4IOU__9PZW4brQ5V7NhSsVtSdI_mrQxHPKYF0BzA" />
          </div>
        </div>
      </header>
      {/* Main Content Canvas */}
      <main className="pt-24 pb-12 px-6 md:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center text-[10px] font-bold tracking-widest text-on-surface-variant/60 uppercase mb-2">
                <a className="hover:text-primary transition-colors" href="/hms/billing">Billing</a>
                <span className="mx-2">/</span>
                <span>Invoice Summary</span>
              </nav>
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Billing Summary</h2>
              <div className="flex items-center mt-2 gap-3">
                <span className="text-sm font-medium text-on-surface-variant">John Doe</span>
                <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                <code className="text-xs font-mono bg-surface-container text-primary px-2 py-0.5 rounded">P-2026-001</code>
              </div>
            </div>
            <div className="flex gap-3">
              <a className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="/hms/billing">
                <span className="material-symbols-outlined text-lg" data-icon="download">download</span>
                Export PDF
              </a>
            </div>
          </div>
          {/* Billing Layout (Bento Grid Inspired) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Invoice Detail */}
            <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-sm ring-1 ring-on-surface/[0.03]">
              <div className="mb-10 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Invoice Issued</p>
                  <p className="text-sm font-medium">October 24, 2023</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container border border-secondary/20">
                    Pending Payment
                  </span>
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-container text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    <th className="pb-4 font-black">Description</th>
                    <th className="pb-4 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  <tr>
                    <td className="py-6">
                      <div className="text-sm font-semibold text-on-surface">Consultation Fee</div>
                      <div className="text-xs text-on-surface-variant mt-1">General checkup and follow-up appointment</div>
                    </td>
                    <td className="py-6 text-right font-medium text-on-surface">$50.00</td>
                  </tr>
                  <tr>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                        <input className="text-sm bg-surface-container-low border-none focus:ring-0 rounded-lg w-full placeholder:text-on-surface-variant/40 placeholder:italic transition-all focus:bg-white focus:shadow-inner" placeholder="Add extra charges..." type="text" />
                      </div>
                    </td>
                    <td className="py-6 text-right font-medium text-on-surface-variant/40">$0.00</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-12 flex justify-end">
                <div className="w-48 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Subtotal</span>
                    <span className="text-on-surface">$50.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Tax (0%)</span>
                    <span className="text-on-surface">$0.00</span>
                  </div>
                  <div className="pt-4 border-t border-surface-container flex justify-between items-baseline">
                    <span className="text-xs font-black uppercase tracking-widest text-on-surface">Total Due</span>
                    <span className="text-2xl font-black text-on-surface tracking-tighter">$50.00</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Side Actions & Context */}
            <div className="space-y-6">
              <div className="bg-primary rounded-xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-6">Quick Actions</p>
                  <div className="flex flex-col gap-3">
                    <a className="w-full bg-white text-primary text-sm font-bold py-3 rounded-lg shadow-sm transition-transform active:scale-[0.98] text-center" href="/hms/billing">
                    Generate Bill
                    </a>
                    <a className="w-full bg-secondary-container text-on-secondary-container text-sm font-bold py-3 rounded-lg shadow-sm transition-transform active:scale-[0.98] text-center" href="/hms/billing">
                    Mark as Paid
                    </a>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]" data-icon="receipt">receipt</span>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">Patient Information</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-outline-variant/30">
                    <img className="w-full h-full object-cover" data-alt="Portrait of a middle aged man with short hair and a warm friendly expression in a neutral studio background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeH2lsP6f4lDA9ZOXVFySIgibLwT4cr4U-6Gh_QGRNbiPbCrUMST54lmUAN5Df6KmTzpcF_tAxJ6EEKGTft0dXFIwXL6wNpOg2_9Xhg65ATG8acESgviG-gV33RYVb10kRGWFUMn0R-CuIAIpOyI9JPh4iyKga9ysoZfM42CDTByQtvcIaH9og_nWBRS056hk65ZpdQKt0ZBH6QPoISDxXdtGDPPJMQsx7xwW6M-GD6HDrUnvmrL4A0tICgWWsl1bfHiZ_OYajm-c" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface leading-tight">John Doe</p>
                    <p className="text-xs text-on-surface-variant">Active since Jan 2021</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Insurance</span>
                    <span className="text-[11px] font-semibold text-on-surface">BlueCross PPO</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Deductible</span>
                    <span className="text-[11px] font-semibold text-on-surface">Remaining: $240</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-highest/20 border border-outline-variant/20 rounded-xl p-6 border-dashed">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-0.5" data-icon="info">info</span>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    <strong>Stripe Integration:</strong> This invoice will be synced automatically with your connected Stripe account upon generation.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Audit Log / History */}
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Billing Activity</h3>
              <a className="text-xs font-bold text-primary hover:underline" href="/hms/billing">View All</a>
            </div>
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="flex items-center px-6 py-4 border-b border-surface-container/50">
                <span className="w-2 h-2 rounded-full bg-secondary mr-4"></span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">Draft Invoice Created</p>
                  <p className="text-xs text-on-surface-variant">By Dr. Sarah Jenkins • 10:45 AM</p>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant/40">TODAY</span>
              </div>
              <div className="flex items-center px-6 py-4 opacity-50">
                <span className="w-2 h-2 rounded-full bg-outline-variant mr-4"></span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">Last Payment Received</p>
                  <p className="text-xs text-on-surface-variant">$120.00 • Sep 14, 2023</p>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant/40">HISTORY</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
