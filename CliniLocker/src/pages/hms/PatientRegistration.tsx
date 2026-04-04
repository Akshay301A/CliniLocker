import { HmsLayout } from "@/components/hms/HmsLayout";

const PatientRegistration = () => {
  return (
    <HmsLayout>
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Patient Registration</h2>
        <p className="text-on-surface-variant/70 mb-6">Add a new patient in under 1 minute.</p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: "Full Name", placeholder: "Aditi Sharma" },
            { label: "Phone Number", placeholder: "+91 98765 43210" },
            { label: "Age", placeholder: "34" },
            { label: "Gender", placeholder: "Female" },
          ].map((field) => (
            <div key={field.label} className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {field.label}
              </label>
              <input
                className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-on-surface transition-all"
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-xs text-on-surface-variant uppercase tracking-widest">Patient ID</p>
              <p className="text-lg font-semibold mt-1">CL-0000-0452</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-xs text-on-surface-variant uppercase tracking-widest">QR Code</p>
              <div className="h-16 w-16 bg-surface-container-highest rounded-lg mt-2" />
            </div>
          </div>
          <div className="col-span-full">
            <button className="w-full md:w-auto tonal-gradient-btn text-white font-bold py-3 px-6 rounded-xl shadow-[0px_8px_16px_rgba(0,88,188,0.2)] active:scale-[0.98] transition-transform">
              Save Patient
            </button>
          </div>
        </form>
      </div>
    </HmsLayout>
  );
};

export default PatientRegistration;

