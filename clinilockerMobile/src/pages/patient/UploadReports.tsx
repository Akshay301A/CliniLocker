import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle, X } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfile, getSelfUploadLabId, uploadReportFile, insertReport } from "@/lib/api";

const PatientUploadReports = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [testName, setTestName] = useState("");
  const [labName, setLabName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") setFile(f);
    else if (f) toast.error(t("Please select a PDF file."));
    e.target.value = "";
  };

  const removeFile = () => setFile(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !file || !user) {
      toast.error(t("Please enter test name and attach a PDF."));
      return;
    }
    setLoading(true);
    const selfLabId = await getSelfUploadLabId();
    if (!selfLabId) {
      toast.error(t("Self Upload lab not found. Please try again later."));
      setLoading(false);
      return;
    }
    const profile = await getProfile();
    const path = `self/${user.id}/${crypto.randomUUID()}.pdf`;
    const up = await uploadReportFile(path, file);
    if ("error" in up) {
      toast.error(up.error);
      setLoading(false);
      return;
    }
    const ins = await insertReport({
      lab_id: selfLabId,
      patient_id: user.id,
      patient_name: profile?.full_name ?? "Self",
      patient_phone: profile?.phone ?? "",
      test_name: testName.trim(),
      file_url: path,
      test_date: testDate || null,
    });
    setLoading(false);
    if ("error" in ins) {
      toast.error(ins.error);
      return;
    }
    setUploaded(true);
    setFile(null);
    setTestName("");
    setLabName("");
    setTestDate("");
    toast.success(t("Report uploaded successfully!"));
  };

  if (uploaded) {
    return (
      <PatientLayout>
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">{t("Report Uploaded!")}</h2>
          <p className="mt-2 text-muted-foreground text-center max-w-md">
            {t("Your report has been saved to your health vault securely.")}
          </p>
          <Button className="mt-6" onClick={() => setUploaded(false)}>
            {t("Upload Another Report")}
          </Button>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="mx-auto max-w-xl animate-fade-in w-full">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("Upload Report")}</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">{t("Add reports from other labs or clinics to your health vault.")}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card space-y-4">
            <div>
              <Label htmlFor="testName">{t("Test Name")}</Label>
              <Input id="testName" placeholder={t("e.g., CBC, Lipid Profile")} value={testName} onChange={(e) => setTestName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="labName">{t("Lab / Clinic Name (optional)")}</Label>
              <Input id="labName" placeholder={t("e.g., City Diagnostics")} value={labName} onChange={(e) => setLabName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="testDate">{t("Test Date (optional)")}</Label>
              <Input id="testDate" type="date" className="min-h-[44px]" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-card p-6 shadow-card">
            <label htmlFor="fileInput" className="flex cursor-pointer flex-col items-center gap-3 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{t("Click to upload PDF")}</p>
                <p className="text-xs text-muted-foreground">{t("PDF only (max 10MB)")}</p>
              </div>
            </label>
            <input id="fileInput" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

            {file && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" onClick={removeFile} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full min-h-[44px]" disabled={loading || !file}>
            {loading ? t("Uploading…") : t("Upload Report")}
          </Button>
        </form>
      </div>
    </PatientLayout>
  );
};

export default PatientUploadReports;
