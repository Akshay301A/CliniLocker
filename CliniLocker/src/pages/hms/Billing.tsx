import { HmsLayout } from "@/components/hms/HmsLayout";

const Billing = () => {
  return (
    <HmsLayout>
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Billing</h2>
        <p className="text-on-surface-variant/70 mb-6">Generate a clean bill in seconds.</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl">
            <span>Consultation Fee</span>
            <span className="font-semibold">₹ 400</span>
          </div>
          <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl">
            <span>Extra Charges</span>
            <input className="w-32 text-right bg-white/80 px-3 py-2 rounded-lg" placeholder="0" />
          </div>
          <div className="flex items-center justify-between bg-surface-container-high p-4 rounded-xl">
            <span className="font-semibold">Total</span>
            <span className="font-bold">₹ 400</span>
          </div>
          <div className="flex gap-3">
            <button className="tonal-gradient-btn text-white font-bold py-3 px-6 rounded-xl shadow-[0px_8px_16px_rgba(0,88,188,0.2)]">
              Generate Bill
            </button>
            <button className="bg-secondary-container text-on-secondary-container font-semibold py-3 px-6 rounded-xl">
              Mark as Paid
            </button>
          </div>
        </div>
      </div>
    </HmsLayout>
  );
};

export default Billing;

