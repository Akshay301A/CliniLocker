import { HmsLayout } from "@/components/hms/HmsLayout";

const ReportUpload = () => {
  return (
    <HmsLayout>
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Report Upload</h2>
        <p className="text-on-surface-variant/70 mb-6">Attach PDF or images to a patient record.</p>
        <div className="space-y-4">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <p className="text-sm text-on-surface-variant">Drop files here or browse</p>
            <input className="mt-3" type="file" multiple />
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
            <h4 className="font-semibold mb-3">Uploaded Reports</h4>
            <ul className="text-sm text-on-surface-variant space-y-2">
              <li>Blood Test · Feb 2026</li>
              <li>X-Ray · Jan 2026</li>
            </ul>
          </div>
        </div>
      </div>
    </HmsLayout>
  );
};

export default ReportUpload;

