const QrView = () => {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] max-w-xl w-full">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Patient QR View</h2>
        <p className="text-on-surface-variant/70 mb-6">Quick access to patient details.</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-6 items-start">
          <div className="space-y-3">
            <p className="text-sm"><span className="font-semibold">Name:</span> Aditi Sharma</p>
            <p className="text-sm"><span className="font-semibold">Patient ID:</span> CL-0000-0452</p>
            <p className="text-sm"><span className="font-semibold">Blood Group:</span> O+</p>
            <p className="text-sm"><span className="font-semibold">Recent Prescription:</span> Paracetamol 500mg</p>
          </div>
          <div className="h-40 w-40 bg-surface-container-highest rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default QrView;

