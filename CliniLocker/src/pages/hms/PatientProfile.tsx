import React from "react";

export default function PatientProfile() {
  return (
    <div className="bg-surface text-on-surface">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f6f3f5] dark:bg-slate-900 flex flex-col h-full p-4 space-y-2 z-[60]">
        <div className="px-2 py-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined" data-icon="medical_services">medical_services</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-[#1b1b1d] dark:text-white leading-tight">CliniLocker</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#1b1b1d]/40 font-bold">Medical Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] transition-all duration-200 ease-in-out font-medium text-sm rounded-lg" href="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 text-[#0058bc] dark:text-white rounded-lg shadow-sm font-semibold text-sm transition-all duration-200 ease-in-out" href="/hms/patients/1">
            <span className="material-symbols-outlined" data-icon="group" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <span>Patients</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] transition-all duration-200 ease-in-out font-medium text-sm rounded-lg" href="/hms/visits/new">
            <span className="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
            <span>Visits</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] transition-all duration-200 ease-in-out font-medium text-sm rounded-lg" href="/hms/billing">
            <span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
            <span>Billing</span>
          </a>
        </nav>
        <div className="pt-4 mt-4 border-t border-black/5 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] transition-all duration-200 ease-in-out font-medium text-sm rounded-lg" href="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span>Settings</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 dark:text-slate-400 hover:text-[#0058bc] hover:bg-[#fcf8fb] transition-all duration-200 ease-in-out font-medium text-sm rounded-lg" href="/hms/dashboard">
            <span className="material-symbols-outlined" data-icon="help">help</span>
            <span>Support</span>
          </a>
        </div>
      </aside>
      {/* Main Wrapper */}
      <main className="pl-64 min-h-screen">
        {/* TopNavBar */}
        <header className="sticky top-0 z-50 bg-[#fcf8fb]/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center w-full px-8 py-3 shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
          <div className="flex items-center gap-8 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" data-icon="search">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search patients, records..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:scale-95 transition-transform active:opacity-80 flex items-center gap-2" href="/hms/patients/new">
              <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
              Add New Patient
            </a>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors relative">
                <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
              </button>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-none">Dr. Sarah Smith</p>
                <p className="text-[10px] text-on-surface-variant">Chief Medical Officer</p>
              </div>
              <img alt="Doctor Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/10" data-alt="professional portrait of a confident female doctor in a white coat with a friendly expression in a modern clinic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1x47rKJozFo9lWyeNJ79M-DbVySrenx0mJh55fwcrHS1ZqaoY9dCLFLbOEcP7W7EJUQmFGGo7R6TwpfPbL2dfDvuGxnjG6qZpVWYjoB5aWAgRb5U-bj7c5DuR63YnsLmAU3so0Oc7naY33tj2HFqW8srYp7wBIaHD4FIj37vIjHgUcLazVAoo92ZM53Cv-OXTeLcdAlK-yAN9PL-MbIyfFuN8Zts_qnp092_0znNeuE2TrR_4aOxTjb_dodVAY8nITgQbbwKiTog" />
            </div>
          </div>
        </header>
        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-4">
                <span className="hover:text-primary cursor-pointer">Patients</span>
                <span className="material-symbols-outlined text-[10px]" data-icon="chevron_right">chevron_right</span>
                <span className="text-on-surface">P-2026-001</span>
              </nav>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center text-primary font-bold text-2xl shadow-inner">
                  JD
                </div>
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">John Doe</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="bg-surface-container px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-on-surface-variant">ID: P-2026-001</span>
                    <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                    <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-secondary" data-icon="verified" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified Profile
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <a className="bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors flex items-center gap-2" href="/hms/reports">
                <span className="material-symbols-outlined text-lg" data-icon="upload_file">upload_file</span>
                Upload Report
              </a>
              <a className="bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:scale-[0.98] transition-transform flex items-center gap-2" href="/hms/visits/new">
                <span className="material-symbols-outlined text-lg" data-icon="add_circle" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                Add Visit
              </a>
            </div>
          </section>
          {/* Grid Layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* Main Content (8 cols) */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* Basic Details Bento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.05em] text-on-surface-variant mb-2">Age</p>
                  <p className="text-xl font-bold text-on-surface">34 Yrs</p>
                  <p className="text-xs text-on-surface-variant mt-1">Adult Male</p>
                </div>
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.05em] text-on-surface-variant mb-2">Gender</p>
                  <p className="text-xl font-bold text-on-surface">Male</p>
                  <div className="w-full h-1 bg-surface-container-high rounded-full mt-3 overflow-hidden">
                    <div className="w-full h-full bg-primary/20"></div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.05em] text-on-surface-variant mb-2">Blood Group</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-error">O+</p>
                    <span className="material-symbols-outlined text-error text-lg" data-icon="bloodtype" style={{ fontVariationSettings: "'FILL' 1" }}>bloodtype</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">Universal Donor</p>
                </div>
                <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.05em] text-on-surface-variant mb-2">Contact</p>
                  <p className="text-sm font-bold text-on-surface">+1 (555) 012-3456</p>
                  <p className="text-[10px] text-primary font-medium mt-1 hover:underline cursor-pointer">Email Patient</p>
                </div>
              </div>
              {/* Tabs Section */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
                <div className="flex border-b border-surface-container px-6 pt-2">
                  <button className="px-4 py-4 text-sm font-bold border-b-2 border-primary text-primary transition-all">Visit History</button>
                  <button className="px-4 py-4 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-all">Prescriptions</button>
                  <button className="px-4 py-4 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-all">Reports</button>
                  <button className="px-4 py-4 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-all">Medical Notes</button>
                </div>
                <div className="p-0">
                  {/* Visit History List */}
                  <div className="divide-y divide-surface-container-low">
                    <div className="p-6 hover:bg-surface-container-low/30 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-on-secondary-container">
                            <span className="material-symbols-outlined" data-icon="stethoscope">stethoscope</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface">General Consultation</h4>
                            <p className="text-xs text-on-surface-variant">Oct 12, 2023 • Dr. Robert Chen</p>
                            <div className="mt-2 flex gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant uppercase">Completed</span>
                            </div>
                          </div>
                        </div>
                        <a className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-primary transition-all" href="/hms/visits/new">
                          <span className="material-symbols-outlined" data-icon="open_in_new">open_in_new</span>
                        </a>
                      </div>
                    </div>
                    <div className="p-6 hover:bg-surface-container-low/30 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-tertiary-fixed rounded-lg flex items-center justify-center text-on-tertiary-fixed-variant">
                            <span className="material-symbols-outlined" data-icon="vaccines">vaccines</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface">Flu Vaccination</h4>
                            <p className="text-xs text-on-surface-variant">Aug 24, 2023 • Nurse Emily Davis</p>
                            <div className="mt-2 flex gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant uppercase">Administered</span>
                            </div>
                          </div>
                        </div>
                        <a className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-primary transition-all" href="/hms/visits/new">
                          <span className="material-symbols-outlined" data-icon="open_in_new">open_in_new</span>
                        </a>
                      </div>
                    </div>
                    <div className="p-6 hover:bg-surface-container-low/30 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-error-container rounded-lg flex items-center justify-center text-on-error-container">
                            <span className="material-symbols-outlined" data-icon="emergency_home">emergency_home</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface">Emergency Care - Abdominal Pain</h4>
                            <p className="text-xs text-on-surface-variant">May 05, 2023 • Dr. Sarah Smith</p>
                            <div className="mt-2 flex gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant uppercase">Critical</span>
                            </div>
                          </div>
                        </div>
                        <a className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-primary transition-all" href="/hms/visits/new">
                          <span className="material-symbols-outlined" data-icon="open_in_new">open_in_new</span>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container-low/50 text-center">
                    <a className="text-primary text-xs font-bold hover:underline" href="/hms/visits/new">View All 14 Visits</a>
                  </div>
                </div>
              </div>
              {/* Prescriptions Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold tracking-tight">Active Prescriptions</h3>
                  <a className="text-primary text-sm font-semibold flex items-center gap-1" href="/hms/prescriptions/new">
                    <span className="material-symbols-outlined text-sm" data-icon="print">print</span>
                    Print All
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container p-5 rounded-xl border border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                      <span className="material-symbols-outlined text-primary/10 text-6xl" data-icon="medication">medication</span>
                    </div>
                    <h4 className="font-bold text-primary">Amoxicillin 500mg</h4>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">1 capsule • 3 times daily</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/50 pt-3">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">Ends in 4 Days</p>
                      <button className="p-1 rounded-full hover:bg-white/50 transition-colors">
                        <span className="material-symbols-outlined text-sm" data-icon="info">info</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                      <span className="material-symbols-outlined text-on-surface-variant/10 text-6xl" data-icon="pill">pill</span>
                    </div>
                    <h4 className="font-bold text-on-surface">Lisinopril 10mg</h4>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">1 tablet • once daily</p>
                    <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">Ongoing • Chronic</p>
                      <button className="p-1 rounded-full hover:bg-black/5 transition-colors">
                        <span className="material-symbols-outlined text-sm" data-icon="info">info</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Sidebar Content (4 cols) */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* QR Code Card */}
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] border border-outline-variant/10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary-container"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant mb-6">Patient Digital Identity</p>
                <div className="relative inline-block p-4 bg-white rounded-2xl shadow-inner border border-surface-container-high mb-6">
                  <div className="w-40 h-40 bg-on-surface flex items-center justify-center rounded-lg overflow-hidden p-1">
                    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-2 relative">
                      <div className="w-full h-full opacity-80" style={{ backgroundImage: "radial-gradient(circle at 10px 10px, #1b1b1d 2px, transparent 0)", backgroundSize: "8px 8px" }}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-1 rounded-md shadow-sm">
                          <span className="material-symbols-outlined text-primary text-xl" data-icon="lock" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-on-surface mb-2">P-2026-001</h4>
                <p className="text-xs text-on-surface-variant mb-8 px-4">Scan to quickly access full medical history or check-in at reception.</p>
                <div className="grid grid-cols-2 gap-3">
                  <a className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors" href="/hms/qr/1">
                    <span className="material-symbols-outlined text-lg" data-icon="download">download</span>
                    Download
                  </a>
                  <a className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors" href="/hms/qr/1">
                    <span className="material-symbols-outlined text-lg" data-icon="print">print</span>
                    Print QR
                  </a>
                </div>
              </div>
              {/* Recent Reports Section */}
              <div className="bg-surface-container-low rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant">Recent Reports</h3>
                  <span className="material-symbols-outlined text-on-surface-variant/40" data-icon="file_present">file_present</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center justify-between group cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-error-container text-error rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg" data-icon="picture_as_pdf">picture_as_pdf</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface truncate w-32">Blood_Panel_Oct23.pdf</p>
                        <p className="text-[10px] text-on-surface-variant">Oct 14, 2023 • 1.2MB</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant hover:text-primary" data-icon="download">download</span>
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center justify-between group cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-tertiary-container/10 text-tertiary-container rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg" data-icon="image">image</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface truncate w-32">Chest_XRay_Aug23.png</p>
                        <p className="text-[10px] text-on-surface-variant">Aug 28, 2023 • 4.5MB</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant hover:text-primary" data-icon="download">download</span>
                  </div>
                </div>
                <a className="w-full mt-4 py-2 border border-dashed border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-all text-center" href="/hms/reports">
                  View All Reports
                </a>
              </div>
              {/* Upcoming Appointments */}
              <div className="p-6 rounded-xl border border-outline-variant/10 bg-white">
                <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant mb-4">Appointments</h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container">
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-white"></div>
                    <p className="text-xs font-black text-primary uppercase">Tomorrow, 10:30 AM</p>
                    <p className="text-sm font-bold text-on-surface">Cardiology Follow-up</p>
                    <p className="text-xs text-on-surface-variant">Dr. James Wilson</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-surface-container ring-4 ring-white"></div>
                    <p className="text-xs font-black text-on-surface-variant uppercase">Nov 04, 2023</p>
                    <p className="text-sm font-bold text-on-surface">Annual Physical</p>
                    <p className="text-xs text-on-surface-variant">Dr. Robert Chen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
