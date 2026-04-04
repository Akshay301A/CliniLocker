import React from "react";

export default function QrView() {
  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20">
      {/* TopAppBar (Suppressed Shell for Focused QR Experience) */}
      <header className="glass-header sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg jewel-button flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg" data-icon="lock">lock</span>
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-on-surface">CliniLocker</h1>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center surface-container-low transition-transform active:scale-95">
          <span className="material-symbols-outlined text-primary" data-icon="share">share</span>
        </button>
      </header>
      <main className="max-w-md mx-auto px-6 pt-8 space-y-8">
        {/* Patient Identity Section */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              alt="Sarah Jenkins"
              className="w-24 h-24 rounded-full object-cover border-4 border-surface-container-lowest shadow-xl"
              data-alt="Professional portrait of a middle-aged woman with a friendly expression in a bright studio setting with soft natural light"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCanQDYIXbrpcCcQjdWsdHZHe313dZ9yFucEApetzLznp7sB4iMH-E3yhljPwH5cP9WUqYUCGFxy9Vyt4KD5XtMRZK-b9Oxz76kJbT2NFVagr_DgKL7JT2H3fLwYf1VsaPSR5EBrkScmbkWBzVof_ANs1PBoju7L8hKiBZhl5r0kfFpikZYwffcX-GOfIvU2kYWJJtP03X2ZF6EldMgpZyYKHl1h2XYjweI___lXjhwIjpktalNVeNEqGZul5OQSj5ti6CyBUIfe9I"
            />
            <div className="absolute -bottom-1 -right-1 bg-secondary-container p-1 rounded-full border-2 border-white">
              <span className="material-symbols-outlined text-on-secondary-container text-xs" data-icon="verified" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Sarah Jenkins</h2>
            <p className="text-sm font-medium tracking-wide text-on-surface-variant/70 uppercase pt-1">Patient ID: #CL-88291</p>
          </div>
          <div className="grid grid-cols-3 w-full gap-2 pt-2">
            <div className="surface-container-low rounded-xl py-3 px-2">
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Age</p>
              <p className="text-lg font-bold text-on-surface">42</p>
            </div>
            <div className="surface-container-low rounded-xl py-3 px-2">
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Blood</p>
              <p className="text-lg font-bold text-primary">A+</p>
            </div>
            <div className="surface-container-low rounded-xl py-3 px-2">
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Gender</p>
              <p className="text-lg font-bold text-on-surface">F</p>
            </div>
          </div>
        </section>
        {/* Main Content Layers */}
        <div className="space-y-4">
          {/* Current Prescriptions */}
          <div className="tonal-card rounded-xl p-5 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-icon="prescriptions">prescriptions</span>
                <h3 className="font-bold text-on-surface tracking-tight">Active Prescriptions</h3>
              </div>
              <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-1 rounded-full uppercase">3 Items</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div>
                  <p className="text-sm font-bold text-on-surface leading-none">Lisinopril 10mg</p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">1 tablet daily in the morning for hypertension control.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div>
                  <p className="text-sm font-bold text-on-surface leading-none">Metformin 500mg</p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">2 tablets with meals twice a day.</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-3 text-sm font-bold text-primary surface-container-low rounded-lg transition-colors active:bg-surface-container-high">
              View Full Med-List
            </button>
          </div>
          {/* Recent Reports */}
          <div className="tonal-card rounded-xl p-5 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" data-icon="lab_research">lab_research</span>
              <h3 className="font-bold text-on-surface tracking-tight">Recent Diagnostic Reports</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant" data-icon="description">description</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">CBC &amp; Lipid Profile</p>
                    <p className="text-[10px] text-on-surface-variant">Oct 24, 2023</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary" data-icon="arrow_forward_ios" style={{ fontSize: 16 }}>arrow_forward_ios</span>
              </div>
              <div className="flex items-center justify-between p-3 surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant" data-icon="radiology">radiology</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Chest X-Ray (AP View)</p>
                    <p className="text-[10px] text-on-surface-variant">Sep 12, 2023</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary" data-icon="arrow_forward_ios" style={{ fontSize: 16 }}>arrow_forward_ios</span>
              </div>
            </div>
          </div>
          {/* Recent Visits */}
          <div className="tonal-card rounded-xl p-5 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" data-icon="calendar_month">calendar_month</span>
              <h3 className="font-bold text-on-surface tracking-tight">Recent Consultations</h3>
            </div>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-surface-container-high">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-surface-container-lowest"></div>
                <p className="text-xs font-bold text-primary mb-1">Last Week</p>
                <p className="text-sm font-bold text-on-surface">Dr. Elena Rodriguez</p>
                <p className="text-xs text-on-surface-variant">General Cardiology Follow-up</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-surface-dim ring-4 ring-surface-container-lowest"></div>
                <p className="text-xs font-bold text-on-surface-variant mb-1">Sep 05, 2023</p>
                <p className="text-sm font-bold text-on-surface">Dr. James Wilson</p>
                <p className="text-xs text-on-surface-variant">Annual Physical Examination</p>
              </div>
            </div>
          </div>
        </div>
        {/* Call to Action */}
        <section className="space-y-4 pt-4">
          <button className="w-full jewel-button text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined" data-icon="qr_code_2">qr_code_2</span>
            Present Health QR
          </button>
          <p className="text-[10px] text-center text-on-surface-variant/50 leading-relaxed px-4 italic">
            This summary is for quick reference only. For full medical records, please log in via the CliniLocker Patient Portal.
          </p>
        </section>
      </main>
      {/* Bottom Action Bar (Contextual) */}
      <nav className="fixed bottom-0 left-0 right-0 glass-header border-t border-outline-variant/10 px-8 py-3 flex justify-around items-center md:hidden">
        <div className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" data-icon="person" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-on-surface-variant/60">
          <span className="material-symbols-outlined" data-icon="history">history</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Timeline</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-on-surface-variant/60">
          <span className="material-symbols-outlined" data-icon="lock_open">lock_open</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Security</span>
        </div>
      </nav>
    </div>
  );
}
