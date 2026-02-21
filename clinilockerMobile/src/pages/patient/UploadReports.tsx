import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle, X, Pill, ClipboardList } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfile, getSelfUploadLabId, uploadReportFile, insertReport, uploadPrescriptionFile, insertPrescription, analyzePrescriptionText, extractTextFromPdfUrl } from "@/lib/api";

type UploadType = "report" | "prescription";

const PatientUploadReports = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [uploadType, setUploadType] = useState<UploadType>("report");
  const [file, setFile] = useState<File | null>(null);
  const [testName, setTestName] = useState("");
  const [labName, setLabName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") setFile(f);
    else if (f) toast.error(t("Please select a PDF file."));
    e.target.value = "";
  };

  const removeFile = () => setFile(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) {
      toast.error(t("Please attach a PDF file."));
      return;
    }

    if (uploadType === "report") {
      if (!testName.trim()) {
        toast.error(t("Please enter test name."));
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
    } else {
      // Prescription upload
      setLoading(true);
      setAnalyzing(true);
      try {
        const profile = await getProfile();
        const path = `prescriptions/${user.id}/${crypto.randomUUID()}.pdf`;
        const up = await uploadPrescriptionFile(path, file);
        if ("error" in up) {
          toast.error(up.error);
          setLoading(false);
          setAnalyzing(false);
          return;
        }

        // Analyze prescription with AI
        toast.info(t("Analyzing prescription..."));
        
        // Get signed URL for PDF analysis
        const { supabase } = await import("@/lib/supabase");
        const { data: urlData } = await supabase.storage.from("prescriptions").createSignedUrl(path, 3600);
        
        if (!urlData?.signedUrl) {
          toast.error(t("Failed to get prescription URL."));
          setLoading(false);
          setAnalyzing(false);
          return;
        }
        
        const text = await extractTextFromPdfUrl(urlData.signedUrl);
        const analysis = await analyzePrescriptionText(text);
        
        if ("error" in analysis) {
          toast.error(t("Failed to analyze prescription. Uploading without reminders."));
          // Still insert prescription without reminders
          const ins = await insertPrescription({
            patient_id: user.id,
            patient_name: profile?.full_name ?? "Self",
            file_url: path,
            doctor_name: labName.trim() || null,
            prescription_date: testDate || null,
            reminders: [],
          });
          
          if ("error" in ins) {
            toast.error(ins.error);
            setLoading(false);
            setAnalyzing(false);
            return;
          }
        } else {
          // Insert prescription with reminders
          const ins = await insertPrescription({
            patient_id: user.id,
            patient_name: profile?.full_name ?? "Self",
            file_url: path,
            doctor_name: labName.trim() || analysis.doctor_name || null,
            prescription_date: testDate || analysis.prescription_date || null,
            reminders: analysis.medications || [],
          });
          
          if ("error" in ins) {
            toast.error(ins.error);
            setLoading(false);
            setAnalyzing(false);
            return;
          }
          
          const reminderCount = analysis.medications?.length || 0;
          toast.success(t(`Prescription uploaded and ${reminderCount} reminder(s) created!`));
        }
        
        setUploaded(true);
        setFile(null);
        setTestName("");
        setLabName("");
        setTestDate("");
      } catch (error) {
        console.error("Prescription upload error:", error);
        toast.error(t("Failed to process prescription."));
      } finally {
        setLoading(false);
        setAnalyzing(false);
      }
    }
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
      <div className="animate-fade-in space-y-3 md:space-y-4 pb-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">{t("Upload Report or Prescription")}</h1>
          <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">{t("Add reports or prescriptions to your health vault. Prescriptions will be analyzed to create medication reminders.")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Type Selection */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
            <Label className="text-base font-semibold mb-3 block">{t("What are you uploading?")}</Label>
            <RadioGroup value={uploadType} onValueChange={(v) => setUploadType(v as UploadType)} className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50" style={{ borderColor: uploadType === "report" ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                <FileText className={`h-6 w-6 ${uploadType === "report" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${uploadType === "report" ? "text-primary" : "text-muted-foreground"}`}>{t("Report")}</span>
                <RadioGroupItem value="report" className="mt-1" />
              </label>
              <label className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50" style={{ borderColor: uploadType === "prescription" ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                <Pill className={`h-6 w-6 ${uploadType === "prescription" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${uploadType === "prescription" ? "text-primary" : "text-muted-foreground"}`}>{t("Prescription")}</span>
                <RadioGroupItem value="prescription" className="mt-1" />
              </label>
            </RadioGroup>
          </div>

          {/* Form Fields - Show different fields based on type */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm space-y-3">
            {uploadType === "report" ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="doctorName">{t("Doctor Name (optional)")}</Label>
                  <Input id="doctorName" placeholder={t("e.g., Dr. John Smith")} value={labName} onChange={(e) => setLabName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="prescriptionDate">{t("Prescription Date (optional)")}</Label>
                  <Input id="prescriptionDate" type="date" className="min-h-[44px]" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    {t("After uploading, AI will analyze your prescription and create medication reminders automatically. You can edit them later.")}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 md:p-8 shadow-sm">
            <label htmlFor="fileInput" className="flex cursor-pointer flex-col items-center gap-3 py-4 md:py-6">
              <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <Upload className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm md:text-base text-foreground">{t("Click to upload PDF")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("PDF only (max 10MB)")}</p>
              </div>
            </label>
            <input id="fileInput" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

            {file && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-medium text-foreground block">{file.name}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
                <button type="button" onClick={removeFile} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full min-h-[44px] rounded-lg text-sm font-semibold" disabled={loading || !file || analyzing}>
            {analyzing ? t("Analyzing prescription…") : loading ? t("Uploading…") : uploadType === "report" ? t("Upload Report") : t("Upload Prescription")}
          </Button>
        </form>
      </div>
    </PatientLayout>
  );
};

export default PatientUploadReports;
