import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileText, CheckCircle, X, Pill, ClipboardList, ImagePlus, Plus, Camera, Images, FolderOpen } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getProfile,
  getSelfUploadLabId,
  uploadReportFile,
  insertReport,
  uploadPrescriptionFile,
  insertPrescription,
  analyzePrescriptionFromPdfUrl,
  sendPatientAlertPush,
} from "@/lib/api";
import { jsPDF } from "jspdf";

type UploadType = "report" | "prescription";
type UploadMode = "pdf" | "images";
type PageOption = "1" | "2" | "3" | "4+";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const PAGE_OPTIONS: PageOption[] = ["1", "2", "3", "4+"];
const REPORT_CATEGORIES = [
  "Blood",
  "Hormone",
  "Imaging",
  "Cardiac",
  "Urine",
  "Liver",
  "Kidney",
  "Thyroid",
  "Diabetes",
  "CBC",
  "Lipid",
  "Vitamin",
  "Allergy",
  "Other",
] as const;

const PatientUploadReports = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [uploadType, setUploadType] = useState<UploadType>("report");
  const [uploadMode, setUploadMode] = useState<UploadMode>("pdf");

  const [file, setFile] = useState<File | null>(null);
  const [testName, setTestName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [labName, setLabName] = useState("");
  const [testDate, setTestDate] = useState("");

  const [pageOption, setPageOption] = useState<PageOption>("1");
  const [customPageCount, setCustomPageCount] = useState("4");
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null]);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [imageSourceDialogOpen, setImageSourceDialogOpen] = useState(false);
  const [pdfSourceDialogOpen, setPdfSourceDialogOpen] = useState(false);
  const [activeImageSlot, setActiveImageSlot] = useState<number | null>(null);

  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);

  const imageCameraInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const imageGalleryInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const imageFilesInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const pdfCameraInputRef = useRef<HTMLInputElement | null>(null);
  const pdfGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const selectedPageCount = useMemo(() => {
    if (pageOption !== "4+") return Number(pageOption);
    const parsed = Number(customPageCount);
    if (!Number.isFinite(parsed)) return 4;
    return Math.min(15, Math.max(4, Math.floor(parsed)));
  }, [pageOption, customPageCount]);

  const imagePreviewUrls = useMemo(
    () => imageFiles.map((img) => (img ? URL.createObjectURL(img) : null)),
    [imageFiles]
  );

  useEffect(() => {
    if (uploadType !== "report" || uploadMode !== "images") return;
    setImageFiles((prev) => {
      const next = Array(selectedPageCount).fill(null) as (File | null)[];
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i];
      return next;
    });
  }, [selectedPageCount, uploadType, uploadMode]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviewUrls]);

  useEffect(() => {
    return () => {
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    };
  }, [previewPdfUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      if (f.size > MAX_PDF_BYTES) toast.error(t("PDF must be under 10 MB."));
      else setFile(f);
    } else if (f) {
      toast.error(t("Please select a PDF file."));
    }
    e.target.value = "";
  };

  const handleImagePickedForPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      toast.error(t("Please select an image file."));
      e.target.value = "";
      return;
    }
    setConverting(true);
    try {
      const converted = await convertImagesToPdfFile([picked]);
      setFile(converted);
      toast.success(t("Image converted to PDF."));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Failed to convert image to PDF.");
      toast.error(message);
    } finally {
      setConverting(false);
      e.target.value = "";
    }
  };

  const removeFile = () => setFile(null);

  const handleImageSlotChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      toast.error(t("Please select an image file."));
      e.target.value = "";
      return;
    }
    setImageFiles((prev) => {
      const next = [...prev];
      next[index] = picked;
      return next;
    });
    e.target.value = "";
  };

  const openImageSourcePicker = (index: number) => {
    setActiveImageSlot(index);
    setImageSourceDialogOpen(true);
  };

  const pickImageSource = (source: "camera" | "gallery" | "files") => {
    if (activeImageSlot === null) return;
    const refMap =
      source === "camera"
        ? imageCameraInputRefs
        : source === "gallery"
          ? imageGalleryInputRefs
          : imageFilesInputRefs;
    setImageSourceDialogOpen(false);
    refMap.current[activeImageSlot]?.click();
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const fileToJpegDataUrl = async (imgFile: File, quality: number, maxDim: number): Promise<string> => {
    const srcUrl = URL.createObjectURL(imgFile);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = srcUrl;
      });
      const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", quality);
    } finally {
      URL.revokeObjectURL(srcUrl);
    }
  };

  const buildPdfBlob = async (pages: File[], quality: number, maxDim: number): Promise<Blob> => {
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const targetW = pageW - margin * 2;
    const targetH = pageH - margin * 2;

    for (let i = 0; i < pages.length; i++) {
      const dataUrl = await fileToJpegDataUrl(pages[i], quality, maxDim);
      if (i > 0) pdf.addPage();
      const props = pdf.getImageProperties(dataUrl);
      const ratio = Math.min(targetW / props.width, targetH / props.height);
      const drawW = props.width * ratio;
      const drawH = props.height * ratio;
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      pdf.addImage(dataUrl, "JPEG", x, y, drawW, drawH, undefined, "FAST");
    }
    return pdf.output("blob");
  };

  const convertImagesToPdfFile = async (pages: File[]): Promise<File> => {
    const qualities = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48];
    const maxDims = [2200, 1800, 1500, 1300, 1100, 900];
    let bestBlob: Blob | null = null;

    for (let i = 0; i < qualities.length; i++) {
      const blob = await buildPdfBlob(pages, qualities[i], maxDims[i]);
      bestBlob = blob;
      if (blob.size <= MAX_PDF_BYTES) {
        return new File([blob], `report-${Date.now()}.pdf`, { type: "application/pdf" });
      }
    }

    if (!bestBlob) throw new Error("Failed to build PDF");
    throw new Error(t("Could not compress generated PDF below 10 MB. Please use clearer and fewer images."));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("Please attach a PDF file."));
      return;
    }

    if (uploadType === "report") {
      const category = testName === "Other" ? customCategory.trim() : testName.trim();
      if (!category) {
        toast.error(t("Please select a report category."));
        return;
      }
      if (!labName.trim()) {
        toast.error(t("Please enter lab name."));
        return;
      }
      if (!testDate) {
        toast.error(t("Please select test date."));
        return;
      }

      let uploadFile: File | null = file;
      if (uploadMode === "images") {
        const selectedImages = imageFiles.filter((f): f is File => !!f);
        if (selectedImages.length !== selectedPageCount) {
          toast.error(t("Please add all report pages before continuing."));
          return;
        }
        setConverting(true);
        try {
          uploadFile = await convertImagesToPdfFile(selectedImages);
          if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(URL.createObjectURL(uploadFile));
        } catch (err) {
          const message = err instanceof Error ? err.message : t("Failed to convert images to PDF.");
          toast.error(message);
          setConverting(false);
          return;
        } finally {
          setConverting(false);
        }
      }

      if (!uploadFile) {
        toast.error(t("Please attach a PDF file."));
        return;
      }
      if (uploadFile.size > MAX_PDF_BYTES) {
        toast.error(t("PDF must be under 10 MB."));
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
      const up = await uploadReportFile(path, uploadFile);
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
        test_name: category,
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
      setImageFiles(Array(selectedPageCount).fill(null));
      setTestName("");
      setLabName("");
      setTestDate("");
      toast.success(t("Report uploaded successfully!"));
      await sendPatientAlertPush({
        patientId: user.id,
        title: "Report Uploaded",
        body: `${testName.trim()} has been added to your health vault.`,
        data: {
          type: "report_ready",
          route: "/patient/reports",
        },
      });
      return;
    }

    // Prescription upload
    if (!file) {
      toast.error(t("Please attach a PDF file."));
      return;
    }

    setLoading(true);
    setAnalyzing(true);
    try {
      const profile = await getProfile();
      const path = `${user.id}/${crypto.randomUUID()}.pdf`;
      const up = await uploadPrescriptionFile(path, file);
      if ("error" in up) {
        toast.error(up.error);
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      toast.info(t("Analyzing prescription..."));
      const { supabase } = await import("@/lib/supabase");
      const { data: urlData } = await supabase.storage.from("prescriptions").createSignedUrl(path, 3600);

      if (!urlData?.signedUrl) {
        toast.error(t("Failed to get prescription URL."));
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      const analysis = await analyzePrescriptionFromPdfUrl(urlData.signedUrl);

      if ("error" in analysis) {
        toast.error(t("Failed to analyze prescription. Uploading without reminders."));
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

      await sendPatientAlertPush({
        patientId: user.id,
        title: "Prescription Saved",
        body: "Your prescription has been uploaded and analyzed in CliniLocker.",
        data: {
          type: "prescription_uploaded",
          route: "/patient/reminders",
        },
      });

      setUploaded(true);
      setFile(null);
      setLabName("");
      setTestDate("");
    } catch (error) {
      console.error("Prescription upload error:", error);
      toast.error(t("Failed to process prescription."));
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  if (uploaded) {
    return (
      <PatientLayout>
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">
            {uploadType === "report" ? t("Report Uploaded!") : t("Prescription Uploaded!")}
          </h2>
          <p className="mt-2 text-muted-foreground text-center max-w-md">
            {uploadType === "report"
              ? t("Your report has been saved to your health vault securely.")
              : t("Your prescription has been saved securely.")}
          </p>
          {previewPdfUrl && uploadType === "report" && (
            <div className="mt-5 w-full max-w-xl rounded-lg border border-border bg-card p-2">
              <iframe title="Generated PDF Preview" src={previewPdfUrl} className="h-64 w-full rounded-md" />
            </div>
          )}
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

          <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm space-y-3">
            {uploadType === "report" ? (
              <>
                <div>
                  <Label className="mb-2 block">{t("Choose Upload Method")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadMode("pdf")}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        uploadMode === "pdf" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium">{t("Upload PDF")}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("images")}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        uploadMode === "images" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium">{t("Images to PDF")}</div>
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">{t("Report Category")}</Label>
                  <Select value={testName} onValueChange={setTestName}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder={t("Select category")} />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {t(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {testName === "Other" && (
                  <div>
                    <Label htmlFor="customCategory">{t("Other Category")}</Label>
                    <Input
                      id="customCategory"
                      placeholder={t("Enter category")}
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="labName">{t("Lab / Clinic Name")}</Label>
                  <Input id="labName" placeholder={t("e.g., City Diagnostics")} value={labName} onChange={(e) => setLabName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="testDate">{t("Test Date")}</Label>
                  <Input id="testDate" type="date" className="min-h-[44px]" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
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

          {uploadType === "report" && uploadMode === "images" ? (
            <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm space-y-4">
              <div>
                <Label className="mb-2 block">{t("How many pages are in this report?")}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPageOption(opt)}
                      className={`rounded-lg border px-2 py-2 text-sm transition ${
                        pageOption === opt ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {pageOption === "4+" && (
                <div>
                  <Label htmlFor="customPages">{t("Enter total pages")}</Label>
                  <Input id="customPages" type="number" min={4} max={15} value={customPageCount} onChange={(e) => setCustomPageCount(e.target.value)} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imageFiles.map((img, idx) => (
                  <div key={`img-slot-${idx}`} className="rounded-lg border border-dashed border-border p-2">
                    <label
                      className="relative flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-md bg-muted/40 hover:bg-muted/60"
                      onClick={() => openImageSourcePicker(idx)}
                    >
                      {img ? (
                        <img src={imagePreviewUrls[idx] ?? undefined} alt={`page-${idx + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <Plus className="h-5 w-5" />
                          <span className="text-xs">{t("Page")} {idx + 1}</span>
                        </div>
                      )}
                    </label>
                    <input
                      ref={(el) => (imageCameraInputRefs.current[idx] = el)}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleImageSlotChange(idx, e)}
                    />
                    <input
                      ref={(el) => (imageGalleryInputRefs.current[idx] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageSlotChange(idx, e)}
                    />
                    <input
                      ref={(el) => (imageFilesInputRefs.current[idx] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageSlotChange(idx, e)}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t("Page")} {idx + 1}</span>
                      {img && (
                        <button type="button" onClick={() => removeImageFile(idx)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {previewPdfUrl && (
                <div className="rounded-lg border border-border bg-card p-2">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    {t("Generated PDF Preview")}
                  </div>
                  <iframe title="Generated PDF Preview" src={previewPdfUrl} className="h-64 w-full rounded-md" />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 md:p-8 shadow-sm">
              <button type="button" onClick={() => setPdfSourceDialogOpen(true)} className="w-full">
                <div className="flex cursor-pointer flex-col items-center gap-3 py-4 md:py-6">
                  <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                    <Upload className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm md:text-base text-foreground">{t("Upload from PDF or Photo")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("PDF direct, or image auto-converted to PDF (max 10MB)")}</p>
                  </div>
                </div>
              </button>
              <input ref={pdfInputRef} id="fileInput" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
              <input ref={pdfCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImagePickedForPdf} />
              <input ref={pdfGalleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePickedForPdf} />

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
          )}

          <Button
            type="submit"
            className="w-full min-h-[44px] rounded-lg text-sm font-semibold"
            disabled={loading || analyzing || converting || ((uploadType === "report" && uploadMode === "pdf") || uploadType === "prescription" ? !file : false)}
          >
            {converting
              ? t("Converting images to PDF…")
              : analyzing
                ? t("Analyzing prescription…")
                : loading
                  ? t("Uploading…")
                  : uploadType === "report"
                    ? (uploadMode === "images" ? t("Continue & Save Report") : t("Upload Report"))
                    : t("Upload Prescription")}
          </Button>
        </form>
      </div>

      <Dialog open={imageSourceDialogOpen} onOpenChange={setImageSourceDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Add Report Page")}</DialogTitle>
            <DialogDescription>{t("Choose how you want to add this page.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => pickImageSource("camera")}>
              <Camera className="h-4 w-4" />
              {t("Take Photo")}
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => pickImageSource("gallery")}>
              <Images className="h-4 w-4" />
              {t("Choose from Gallery")}
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => pickImageSource("files")}>
              <FolderOpen className="h-4 w-4" />
              {t("Choose from Files")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pdfSourceDialogOpen} onOpenChange={setPdfSourceDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Upload Report")}</DialogTitle>
            <DialogDescription>{t("Pick a PDF, or capture/choose an image and convert it to PDF.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => { setPdfSourceDialogOpen(false); pdfInputRef.current?.click(); }}>
              <FileText className="h-4 w-4" />
              {t("Choose PDF File")}
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => { setPdfSourceDialogOpen(false); pdfCameraInputRef.current?.click(); }}>
              <Camera className="h-4 w-4" />
              {t("Take Photo")}
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => { setPdfSourceDialogOpen(false); pdfGalleryInputRef.current?.click(); }}>
              <Images className="h-4 w-4" />
              {t("Choose from Gallery")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PatientLayout>
  );
};

export default PatientUploadReports;
