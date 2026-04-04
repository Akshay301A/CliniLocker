import { HmsLayout } from "@/components/hms/HmsLayout";

const NewVisit = () => {
  return (
    <HmsLayout>
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">New Visit</h2>
        <p className="text-on-surface-variant/70 mb-6">Start a consultation in seconds.</p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Select Patient</label>
            <input className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl border-none" placeholder="Search patient by name or ID" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Assign Doctor</label>
            <select className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl border-none">
              <option>Dr. Meera Nair</option>
              <option>Dr. Arjun Rao</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date</label>
            <input className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl border-none" type="date" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Time</label>
            <input className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl border-none" type="time" />
          </div>
          <div className="col-span-full">
            <button className="w-full md:w-auto tonal-gradient-btn text-white font-bold py-3 px-6 rounded-xl shadow-[0px_8px_16px_rgba(0,88,188,0.2)] active:scale-[0.98] transition-transform">
              Start Consultation
            </button>
          </div>
        </form>
      </div>
    </HmsLayout>
  );
};

export default NewVisit;

