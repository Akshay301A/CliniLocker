import { LabLayout } from "@/components/LabLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { uploadReportFile, insertReport } from "@/lib/api";

const LabUpload = () => {
  const { labId } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ patientName: "", phone: "", testName: "", file: null as File | null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId || !form.file || !form.patientName.trim() || !form.testName.trim()) {
      toast.error("Please fill patient name, test name, and upload a PDF.");
      return;
    }
    const phone = form.phone.replace(/\s/g, "").trim() || "+91";
    setLoading(true);
    const path = `${labId}/${crypto.randomUUID()}.pdf`;
    const up = await uploadReportFile(path, form.file);
    if ("error" in up) {
      toast.error(up.error);
      setLoading(false);
      return;
    }
    const ins = await insertReport({
      lab_id: labId,
      patient_id: null,
      patient_name: form.patientName.trim(),
      patient_phone: phone,
      test_name: form.testName.trim(),
      file_url: path,
      status: "delivered",
    });
    setLoading(false);
    if ("error" in ins) {
      toast.error(ins.error);
      return;
    }
    setSubmitted(true);
    toast.success("Report uploaded. Patient can access it via CliniLocker.");
  };

  if (submitted) {
    return (
      <LabLayout>
        <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Report Sent!</h2>
            <p className="mt-2 text-muted-foreground">
              The report is saved. Patient can log in with their phone to view it.
            </p>
            <Button className="mt-6" onClick={() => { setSubmitted(false); setForm({ patientName: "", phone: "", testName: "", file: null }); }}>
              Upload Another Report
            </Button>
          </div>
        </div>
      </LabLayout>
    );
  }

  return (
    <LabLayout>
      <div className="animate-fade-in space-y-3 md:space-y-4 pb-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">Upload Report</h1>
          <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">Fill in the details and upload the PDF report.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm space-y-3">
            <div>
              <Label htmlFor="patientName" className="text-xs md:text-sm font-semibold">Patient Name</Label>
              <Input id="patientName" className="mt-1.5 min-h-[44px] rounded-lg text-sm" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Anita Sharma" required />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs md:text-sm font-semibold">Patient Phone Number</Label>
              <Input id="phone" className="mt-1.5 min-h-[44px] rounded-lg text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label htmlFor="testName" className="text-xs md:text-sm font-semibold">Test Name</Label>
              <Input id="testName" className="mt-1.5 min-h-[44px] rounded-lg text-sm" value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} placeholder="CBC + ESR" required />
            </div>
            <div>
              <Label htmlFor="file" className="text-xs md:text-sm font-semibold">PDF Report</Label>
              <div className="mt-1.5 flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 md:p-6 transition-colors hover:border-primary/50">
                <label htmlFor="file" className="flex cursor-pointer flex-col items-center gap-2">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                    <UploadIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {form.file ? form.file.name : "Click to upload PDF"}
                  </span>
                  <input
                    id="file"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                  />
                </label>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full min-h-[44px] rounded-lg text-sm font-semibold" disabled={loading || !form.file}>
            {loading ? "Uploading…" : "Send Report"}
          </Button>
        </form>
      </div>
    </LabLayout>
  );
};

export default LabUpload;
