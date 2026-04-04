import { HmsLayout } from "@/components/hms/HmsLayout";

const PatientProfile = () => {
  return (
    <HmsLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8">
        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Aditi Sharma</h2>
                <p className="text-on-surface-variant/70">Patient ID: CL-0000-0452</p>
              </div>
              <button className="tonal-gradient-btn text-white font-semibold px-4 py-2 rounded-xl">Add Visit</button>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Age", value: "34" },
                { label: "Gender", value: "Female" },
                { label: "Blood Group", value: "O+" },
                { label: "Phone", value: "+91 98765 43210" },
              ].map((item) => (
                <div key={item.label} className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">{item.label}</p>
                  <p className="text-sm font-semibold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
            <h3 className="text-lg font-bold mb-4">Visit History</h3>
            <div className="space-y-3">
              {["Feb 12, 2026 · General Checkup", "Jan 18, 2026 · Follow-up", "Dec 05, 2025 · Flu"].map((v) => (
                <div key={v} className="bg-surface-container-low p-3 rounded-xl text-sm text-on-surface-variant">
                  {v}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
            <h3 className="text-lg font-bold mb-4">QR Code</h3>
            <div className="h-40 w-40 bg-surface-container-highest rounded-xl mb-4" />
            <button className="w-full tonal-gradient-btn text-white font-semibold py-2 rounded-xl">
              Download QR
            </button>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
            <h3 className="text-lg font-bold mb-4">Reports</h3>
            <button className="w-full bg-surface-container-low text-on-surface font-semibold py-2 rounded-xl">
              Upload Report
            </button>
            <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
              <p>Blood Test · Feb 2026</p>
              <p>X-Ray · Jan 2026</p>
            </div>
          </div>
        </div>
      </div>
    </HmsLayout>
  );
};

export default PatientProfile;

