import { HmsLayout } from "@/components/hms/HmsLayout";

const Prescription = () => {
  return (
    <HmsLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Doctor Prescription</h2>
          <p className="text-on-surface-variant/70 mb-6">Record symptoms and generate a clean prescription.</p>
          <form className="space-y-4">
            {[
              { label: "Symptoms", placeholder: "Fever, sore throat..." },
              { label: "Diagnosis", placeholder: "Acute viral infection..." },
              { label: "Notes", placeholder: "Follow up in 3 days..." },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{field.label}</label>
                <textarea className="w-full min-h-[90px] px-4 py-3 bg-surface-container-low rounded-xl border-none" placeholder={field.placeholder} />
              </div>
            ))}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Medicines</label>
              <div className="space-y-2 mt-2">
                {["Paracetamol 500mg · 1-0-1", "Cough Syrup · 10ml"].map((m) => (
                  <div key={m} className="bg-surface-container-low p-3 rounded-xl text-sm">{m}</div>
                ))}
                <button type="button" className="text-primary text-sm font-semibold">+ Add Medicine</button>
              </div>
            </div>
            <button className="w-full md:w-auto tonal-gradient-btn text-white font-bold py-3 px-6 rounded-xl shadow-[0px_8px_16px_rgba(0,88,188,0.2)]">
              Save & Generate Prescription
            </button>
          </form>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)]">
          <h3 className="text-lg font-bold mb-4">Printable Preview</h3>
          <div className="bg-white rounded-xl p-6 min-h-[420px] shadow-inner text-sm text-on-surface-variant">
            <p className="font-semibold text-on-surface">CliniLocker HMS</p>
            <p className="mt-2">Patient: Aditi Sharma</p>
            <p>Date: 04 Apr 2026</p>
            <hr className="my-4" />
            <p><strong>Diagnosis:</strong> Acute viral infection</p>
            <p className="mt-2"><strong>Prescription:</strong></p>
            <ul className="list-disc ml-4">
              <li>Paracetamol 500mg · 1-0-1</li>
              <li>Cough Syrup · 10ml</li>
            </ul>
            <p className="mt-4"><strong>Notes:</strong> Follow up in 3 days.</p>
          </div>
        </div>
      </div>
    </HmsLayout>
  );
};

export default Prescription;

