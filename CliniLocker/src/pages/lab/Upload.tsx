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
      <div className="mx-auto max-w-lg w-full animate-fade-in">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Upload Report</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">Fill in the details and upload the PDF report.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="patientName">Patient Name</Label>
            <Input id="patientName" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Anita Sharma" required />
          </div>
          <div>
            <Label htmlFor="phone">Patient Phone Number</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div>
            <Label htmlFor="testName">Test Name</Label>
            <Input id="testName" value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} placeholder="CBC + ESR" required />
          </div>
          <div>
            <Label htmlFor="file">PDF Report</Label>
            <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary/50">
              <label htmlFor="file" className="flex cursor-pointer flex-col items-center gap-2">
                <UploadIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
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
          <Button type="submit" className="w-full min-h-[44px]" size="lg" disabled={loading || !form.file}>
            {loading ? "Uploading…" : "Send Report"}
          </Button>
        </form>
      </div>
    </LabLayout>
  );
};

export default LabUpload;
