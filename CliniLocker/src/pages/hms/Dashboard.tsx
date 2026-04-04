import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const HEALTH_ID_REGEX = /^CL-\d{4}-\d{4}$/i;

const Dashboard = () => {
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [patients, setPatients] = useState<
    Array<{ name: string; email: string; healthId: string; lastVisit: string; status: string; statusTone: "ok" | "warn" | "critical" }>
  >([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<{ healthId: string; name: string; bloodGroup?: string | null } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const fallbackPatients = useMemo(
    () => [
      {
        name: "John Doe",
        email: "john.doe@email.com",
        healthId: "P-2026-001",
        lastVisit: "Oct 24, 2023",
        status: "Active",
        statusTone: "ok" as const,
      },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    const loadPatients = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          setLoadingPatients(false);
          return;
        }

        const { data: membership } = await supabase
          .from("hospital_users")
          .select("hospital_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!membership?.hospital_id) {
          setLoadingPatients(false);
          return;
        }

        if (!cancelled) {
          setHospitalId(membership.hospital_id);
        }

        const { data: hospitalPatients } = await supabase
          .from("hospital_patients")
          .select("health_id, display_name, created_at")
          .eq("hospital_id", membership.hospital_id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (cancelled) return;

        if (hospitalPatients && hospitalPatients.length > 0) {
          const mapped = hospitalPatients.map((row) => ({
            name: row.display_name || "Patient",
            email: "",
            healthId: row.health_id || "CL-0000-0000",
            lastVisit: "Recent",
            status: "Active",
            statusTone: "ok" as const,
          }));
          setPatients(mapped);
        } else {
          setPatients(fallbackPatients);
        }
      } catch {
        setPatients(fallbackPatients);
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    };

    loadPatients();

    return () => {
      cancelled = true;
    };
  }, [fallbackPatients]);

  const handleUniversalSearch = async () => {
    setSearchError(null);
    setSearchResult(null);
    setRequestSent(false);

    if (!HEALTH_ID_REGEX.test(searchId.trim())) {
      setSearchError("Enter a valid Health ID like CL-0000-0001");
      return;
    }

    const healthId = searchId.trim().toUpperCase();

    const { data, error } = await supabase
      .from("health_cards")
      .select("health_id,name,blood_group")
      .eq("health_id", healthId)
      .maybeSingle();

    if (error || !data) {
      setSearchError("No patient found for this Health ID.");
      return;
    }

    setSearchResult({
      healthId: data.health_id,
      name: data.name || "Patient",
      bloodGroup: data.blood_group,
    });
  };

  const handleRequestAccess = async () => {
    if (!hospitalId || !searchResult) return;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id || null;

    await supabase.from("hospital_access_requests").insert({
      hospital_id: hospitalId,
      health_id: searchResult.healthId,
      requested_by: userId,
      status: "pending",
    });

    setRequestSent(true);
  };

  const patientRows = patients.length > 0 ? patients : fallbackPatients;

  return (
    <div className="bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f6f3f5] flex flex-col p-4 space-y-2 z-40">
        <div className="px-3 py-6 flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">clinical_notes</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-[#1b1b1d] tracking-tighter">CliniLocker</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#1b1b1d]/50 font-bold">Medical Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 bg-white text-[#0058bc] rounded-lg shadow-sm font-medium transition-all duration-200" href="/hms/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg font-medium transition-all duration-200" href="/hms/patients/new">
            <span className="material-symbols-outlined">group</span>
            <span>Patients</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg font-medium transition-all duration-200" href="/hms/visits/new">
            <span className="material-symbols-outlined">calendar_today</span>
            <span>Visits</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 hover:text-[#0058bc] hover:bg-[#fcf8fb] rounded-lg font-medium transition-all duration-200" href="/hms/billing">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Billing</span>
          </a>
        </nav>
        <div className="pt-4 border-t border-on-surface-variant/10 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 hover:text-[#0058bc] rounded-lg font-medium transition-all duration-200" href="/hms/dashboard">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-[#1b1b1d]/70 hover:text-[#0058bc] rounded-lg font-medium transition-all duration-200" href="/hms/dashboard">
            <span className="material-symbols-outlined">help</span>
            <span>Support</span>
          </a>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-50 bg-[#fcf8fb]/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] flex justify-between items-center w-full px-8 py-3">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search patients or records..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a className="bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all" href="/hms/patients/new">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add New Patient
            </a>
            <div className="w-[1px] h-6 bg-on-surface-variant/10 mx-2"></div>
            <button className="text-on-surface-variant hover:bg-[#f6f3f5] p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="flex items-center gap-3 ml-2 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface tracking-tight">Dr. Julian Vance</p>
                <p className="text-[10px] text-on-surface-variant/60">Senior Cardiologist</p>
              </div>
              <img alt="Doctor Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkiKPAS1UqTmHbi-qFCG6YJJnykzy6Y0kk9O2CA1q3yBdZDOM4qFZoCA1-Q3txSc9WwwGJpTffXrHju49eCijF5tXyHT14FbkfW1hjuL5xakLoIUYbOJBQZihQO3OpKnTcgxChskKY1Q8ZHoFW2-mJZ4I-AmNrX9NvwlimWwFA8_rYnB9ptSwbyeVRz2nrHT60gMMfGdE6NjWXTczXOTtw_vEHblotqFvvRbv6H0srlOQ7VLDyUStGgfWNg4dnA0OE1SEDqA49-Fo" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto space-y-10">
          <section className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-on-surface">Dashboard</h2>
              <p className="text-on-surface-variant/70 body-lg">Welcome back. You have 3 urgent reports to review today.</p>
            </div>
            <div className="flex gap-3">
              <a className="bg-surface-container-lowest text-on-surface px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-outline-variant/10 shadow-sm hover:bg-surface-container-low transition-all" href="/hms/visits/new">
                <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                New Visit
              </a>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person_search</span>
                </div>
                <span className="text-[10px] font-bold text-secondary px-2 py-1 bg-secondary-container/20 rounded-full">+12% vs last week</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Today's Patients</p>
                <p className="text-4xl font-extrabold tracking-tighter mt-1">32</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-tertiary/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">event_note</span>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant px-2 py-1 bg-surface-container-high rounded-full">Standard Load</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Upcoming Visits</p>
                <p className="text-4xl font-extrabold tracking-tighter mt-1">12</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-error">priority_high</span>
                </div>
                <span className="text-[10px] font-bold text-error px-2 py-1 bg-error-container/40 rounded-full">Action Required</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pending Bills</p>
                <p className="text-4xl font-extrabold tracking-tighter mt-1">5</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-8">
            <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] overflow-hidden">
              <div className="px-8 py-6 flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight">Your Patients</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
                    <span className="material-symbols-outlined">filter_list</span>
                  </button>
                  <a className="text-primary text-sm font-semibold hover:underline" href="/hms/patients/1">View All</a>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Patient Name</th>
                      <th className="px-8 py-4">Health ID</th>
                      <th className="px-8 py-4">Last Visit</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-on-surface-variant/5">
                    {loadingPatients ? (
                      <tr>
                        <td className="px-8 py-6 text-sm text-on-surface-variant" colSpan={5}>
                          Loading hospital patients...
                        </td>
                      </tr>
                    ) : (
                      patientRows.map((patient) => (
                        <tr key={patient.healthId} className="group hover:bg-surface-container/30 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {patient.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{patient.name}</p>
                                <p className="text-xs text-on-surface-variant/60">{patient.email || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-mono text-xs text-on-surface-variant">{patient.healthId}</td>
                          <td className="px-8 py-5 text-sm text-on-surface-variant">{patient.lastVisit}</td>
                          <td className="px-8 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                patient.statusTone === "critical"
                                  ? "bg-error-container text-on-error-container"
                                  : patient.statusTone === "warn"
                                  ? "bg-surface-container-high text-on-surface-variant"
                                  : "bg-secondary-container text-on-secondary-container"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  patient.statusTone === "critical"
                                    ? "bg-error"
                                    : patient.statusTone === "warn"
                                    ? "bg-on-surface-variant"
                                    : "bg-secondary"
                                }`}
                              ></span>
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <a className="p-2 text-on-surface-variant hover:text-primary transition-colors" href="/hms/patients/1" aria-label="View patient profile">
                              <span className="material-symbols-outlined">open_in_new</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Universal Search</h3>
                  <p className="text-xs text-on-surface-variant">Lookup any patient by Health ID</p>
                </div>
                <span className="text-[10px] font-bold text-secondary px-2 py-1 bg-secondary-container/20 rounded-full">Health ID only</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Health ID</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest"
                    placeholder="CL-0000-0001"
                    value={searchId}
                    onChange={(event) => setSearchId(event.target.value.toUpperCase())}
                  />
                  <button
                    className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90"
                    type="button"
                    onClick={handleUniversalSearch}
                  >
                    Search
                  </button>
                </div>
                {searchError && <p className="text-xs text-error">{searchError}</p>}
              </div>
              {searchResult && (
                <div className="mt-2 rounded-xl border border-outline-variant/20 p-4 bg-surface-container-lowest">
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">Patient Found</p>
                  <p className="text-lg font-bold mt-1">{searchResult.name}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Health ID: <span className="font-mono">{searchResult.healthId}</span>
                  </p>
                  {searchResult.bloodGroup && (
                    <p className="text-xs text-on-surface-variant">Blood Group: {searchResult.bloodGroup}</p>
                  )}
                  <button
                    className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      requestSent ? "bg-surface-container-high text-on-surface-variant" : "bg-primary text-white"
                    }`}
                    type="button"
                    onClick={handleRequestAccess}
                    disabled={requestSent}
                  >
                    {requestSent ? "Request Sent" : "Request Access"}
                  </button>
                </div>
              )}
              {!searchResult && !searchError && (
                <div className="rounded-xl border border-dashed border-outline-variant/30 p-4 text-xs text-on-surface-variant">
                  Enter the Health ID to send an access request. This search does not reveal full patient profiles.
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <a className="bg-[#f6f3f5] p-8 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-primary-container transition-all" href="/hms/reports">
              <div className="space-y-2">
                <h4 className="text-lg font-bold group-hover:text-white">New Medical Record</h4>
                <p className="text-on-surface-variant/70 group-hover:text-white/80 text-sm">
                  Quickly log observations and lab results for an existing patient.
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary">edit_note</span>
              </div>
            </a>
            <a className="bg-[#f6f3f5] p-8 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-tertiary-container transition-all" href="/hms/prescriptions/new">
              <div className="space-y-2">
                <h4 className="text-lg font-bold group-hover:text-white">Pharmacy Portal</h4>
                <p className="text-on-surface-variant/70 group-hover:text-white/80 text-sm">
                  Issue digital prescriptions and check medicine inventory.
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-tertiary">prescriptions</span>
              </div>
            </a>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
