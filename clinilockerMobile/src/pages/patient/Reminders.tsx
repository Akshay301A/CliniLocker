import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, Clock, Edit, FileText, Pill, Plus, Sparkles, Trash2 } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { createMedicationReminder, getMedicationReminders, getPrescriptionSignedUrl, updateMedicationReminder, deleteMedicationReminder } from "@/lib/api";
import { PdfBottomSheet } from "@/components/PdfBottomSheet";
import { getReminderNotificationOffsets, setReminderNotificationOffsets, clearReminderNotificationOffsets } from "@/lib/notifications";

type ReminderRow = {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number | null;
  start_date?: string | null;
  times?: string[] | null;
  notes?: string | null;
  is_active?: boolean;
  prescriptions?: {
    file_url?: string | null;
    doctor_name?: string | null;
    prescription_date?: string | null;
  } | null;
};

type EditFormState = {
  medication_name: string;
  dosage: string;
  frequency: string;
  timesInput: string;
  notes: string;
  is_active: boolean;
  reminderOffsets: number[];
};

const PatientReminders = () => {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderRow | null>(null);
  const [pdfSheetOpen, setPdfSheetOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [editForm, setEditForm] = useState<EditFormState>({
    medication_name: "",
    dosage: "",
    frequency: "",
    timesInput: "",
    notes: "",
    is_active: true,
    reminderOffsets: [-10, -5, 0],
  });

  useEffect(() => {
    void loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    const data = await getMedicationReminders();
    setReminders((data ?? []) as ReminderRow[]);
    setLoading(false);
  };

  const parseTimes = (value: string): string[] => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const hasValidTimes = (times: string[]): boolean => {
    if (!times.length) return true;
    return times.every((time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time));
  };

  const reminderCountText = useMemo(() => {
    const activeCount = reminders.filter((reminder) => reminder.is_active !== false).length;
    if (activeCount === 0) return t("No reminders");
    if (activeCount === 1) return t("1 reminder active");
    return `${activeCount} ${t("reminders active")}`;
  }, [reminders, t]);

  const resetCreateForm = () => {
    setEditForm({
      medication_name: "",
      dosage: "",
      frequency: "",
      timesInput: "",
      notes: "",
      is_active: true,
      reminderOffsets: [-10, -5, 0],
    });
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const handleCreateReminder = async () => {
    const times = parseTimes(editForm.timesInput);
    if (!editForm.medication_name.trim() || !editForm.dosage.trim() || !editForm.frequency.trim()) {
      toast.error(t("Please fill in all required fields."));
      return;
    }
    if (!hasValidTimes(times)) {
      toast.error(t("Time format must be HH:mm (example: 08:00, 20:30)."));
      return;
    }
    if (editForm.reminderOffsets.length === 0) {
      toast.error(t("Please select at least one reminder timing."));
      return;
    }

    setSaving(true);
    try {
      const result = await createMedicationReminder({
        medication_name: editForm.medication_name,
        dosage: editForm.dosage,
        frequency: editForm.frequency,
        times,
        notes: editForm.notes,
        is_active: editForm.is_active,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setReminderNotificationOffsets(result.id, editForm.reminderOffsets);
      if (editForm.is_active && times.length > 0) {
        const { scheduleMedicationReminder } = await import("@/lib/notifications");
        await scheduleMedicationReminder(
          result.id,
          editForm.medication_name.trim(),
          editForm.dosage.trim(),
          times,
          new Date().toISOString().split("T")[0],
          undefined,
          { offsets: editForm.reminderOffsets }
        );
      }

      toast.success(t("Reminder created successfully!"));
      setIsCreateOpen(false);
      await loadReminders();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reminder: ReminderRow) => {
    setEditingReminder(reminder);
    setEditForm({
      medication_name: reminder.medication_name || "",
      dosage: reminder.dosage || "",
      frequency: reminder.frequency || "",
      timesInput: (reminder.times ?? []).join(", "),
      notes: reminder.notes || "",
      is_active: reminder.is_active !== false,
      reminderOffsets: getReminderNotificationOffsets(reminder.id),
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReminder) return;
    const times = parseTimes(editForm.timesInput);

    if (!editForm.medication_name.trim() || !editForm.dosage.trim() || !editForm.frequency.trim()) {
      toast.error(t("Please fill in all required fields."));
      return;
    }

    if (!hasValidTimes(times)) {
      toast.error(t("Time format must be HH:mm (example: 08:00, 20:30)."));
      return;
    }
    if (editForm.reminderOffsets.length === 0) {
      toast.error(t("Please select at least one reminder timing."));
      return;
    }

    const updates = {
      medication_name: editForm.medication_name.trim(),
      dosage: editForm.dosage.trim(),
      frequency: editForm.frequency.trim(),
      times,
      notes: editForm.notes.trim(),
      is_active: editForm.is_active,
    };

    setSaving(true);
    try {
      if (editingReminder.times && editingReminder.times.length > 0) {
        const { cancelMedicationReminder } = await import("@/lib/notifications");
        await cancelMedicationReminder(editingReminder.id, editingReminder.times, editForm.reminderOffsets);
      }
      setReminderNotificationOffsets(editingReminder.id, editForm.reminderOffsets);

      const result = await updateMedicationReminder(editingReminder.id, updates);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      if (updates.is_active && updates.times.length > 0) {
        const { scheduleMedicationReminder } = await import("@/lib/notifications");
        await scheduleMedicationReminder(
          editingReminder.id,
          updates.medication_name,
          updates.dosage,
          updates.times,
          editingReminder.start_date || new Date().toISOString().split("T")[0],
          editingReminder.duration_days || undefined,
          { offsets: editForm.reminderOffsets }
        );
      }

      toast.success(t("Reminder updated successfully!"));
      setIsEditOpen(false);
      setEditingReminder(null);
      await loadReminders();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reminder: ReminderRow) => {
    if (!confirm(t("Are you sure you want to delete this reminder?"))) return;

    if (reminder.times && reminder.times.length > 0) {
      const { cancelMedicationReminder } = await import("@/lib/notifications");
      await cancelMedicationReminder(reminder.id, reminder.times);
    }
    clearReminderNotificationOffsets(reminder.id);

    const result = await deleteMedicationReminder(reminder.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(t("Reminder deleted successfully!"));
    await loadReminders();
  };

  const handleToggleActive = async (reminder: ReminderRow) => {
    const newActiveState = !reminder.is_active;

    if (newActiveState && reminder.times && reminder.times.length > 0) {
      const { scheduleMedicationReminder } = await import("@/lib/notifications");
      const reminderOffsets = getReminderNotificationOffsets(reminder.id);
      await scheduleMedicationReminder(
        reminder.id,
        reminder.medication_name,
        reminder.dosage,
        reminder.times,
        reminder.start_date || new Date().toISOString().split("T")[0],
        reminder.duration_days || undefined,
        { offsets: reminderOffsets }
      );
    } else if (!newActiveState && reminder.times && reminder.times.length > 0) {
      const { cancelMedicationReminder } = await import("@/lib/notifications");
      await cancelMedicationReminder(reminder.id, reminder.times);
    }

    const result = await updateMedicationReminder(reminder.id, { is_active: newActiveState });
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    await loadReminders();
  };

  const toPrescriptionPath = (fileUrl?: string | null): string => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) {
      const match = fileUrl.match(/\/prescriptions\/(.+)$/);
      return match ? match[1] : "";
    }
    return fileUrl;
  };

  const handleOpenPrescriptionPdf = async (reminder: ReminderRow) => {
    const path = toPrescriptionPath(reminder.prescriptions?.file_url);
    if (!path) {
      toast.error(t("Prescription file not available."));
      return;
    }
    const signed = await getPrescriptionSignedUrl(path);
    if (!signed) {
      toast.error(t("Could not open prescription PDF."));
      return;
    }
    setPdfTitle(`${reminder.medication_name} - ${t("Prescription PDF")}`);
    setPdfUrl(signed);
    setPdfSheetOpen(true);
  };

  const toggleOffset = (offset: number, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...editForm.reminderOffsets, offset])).sort((a, b) => a - b)
      : editForm.reminderOffsets.filter((o) => o !== offset);
    setEditForm({ ...editForm, reminderOffsets: next });
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-4 pb-6 md:space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 font-display text-xl font-bold text-foreground md:text-2xl">
                <Pill className="h-6 w-6 text-primary md:h-7 md:w-7" />
                {t("Medication Reminders")}
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
                {t("Manage your medication reminders. Edit times, dosages, or deactivate reminders.")}
              </p>
            </div>
            <Button type="button" className="h-9 shrink-0 gap-1.5 rounded-xl px-3 text-xs shadow-sm md:h-10 md:gap-2 md:px-4 md:text-sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("Add Reminder")}</span>
              <span className="sm:hidden">{t("Add")}</span>
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="rounded-lg px-3 py-1 text-xs">
              {reminderCountText}
            </Badge>
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-xs">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" />
              {t("Stay consistent, stay healthy")}
            </Badge>
          </div>
        </div>

        {reminders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center md:p-12">
            <Pill className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
            <h2 className="mb-2 text-lg font-semibold text-foreground">{t("No reminders yet")}</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {t("Upload a prescription, then add your medication reminders manually.")}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("Add Reminder")}
              </Button>
              <Link to="/patient/upload">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t("Upload Prescription")}
              </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`rounded-2xl border border-border/60 bg-card p-4 shadow-md transition-shadow hover:shadow-lg md:p-5 ${
                  !reminder.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
                      reminder.is_active ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-muted"
                    }`}
                  >
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-foreground md:text-lg">{reminder.medication_name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                          {reminder.dosage} | {reminder.frequency}
                        </p>
                        {reminder.times && reminder.times.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <Clock className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-primary">{reminder.times.join(", ")}</span>
                          </div>
                        )}
                        {reminder.notes && <p className="mt-2 text-xs italic text-muted-foreground">{reminder.notes}</p>}
                        {reminder.prescriptions?.file_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8 rounded-md px-2.5 text-xs"
                            onClick={() => void handleOpenPrescriptionPdf(reminder)}
                          >
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            {t("Open Prescription")}
                          </Button>
                        )}
                        {reminder.start_date && (
                          <div className="mt-2 flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t("Started")}: {new Date(reminder.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant={reminder.is_active ? "default" : "secondary"} className="rounded-md">
                            {reminder.is_active ? t("Active") : t("Paused")}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">{t("Notify")}</Label>
                            <Switch
                              checked={reminder.is_active !== false}
                              onCheckedChange={() => void handleToggleActive(reminder)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(reminder)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => void handleDelete(reminder)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle>{t("Add Reminder")}</DialogTitle>
            <DialogDescription>{t("Create a medication reminder manually.")}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div>
              <Label>{t("Medication Name")}</Label>
              <Input
                value={editForm.medication_name}
                onChange={(e) => setEditForm({ ...editForm, medication_name: e.target.value })}
                placeholder={t("e.g., Paracetamol")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("Dosage")}</Label>
                <Input
                  value={editForm.dosage}
                  onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                  placeholder={t("e.g., 500mg")}
                />
              </div>
              <div>
                <Label>{t("Frequency")}</Label>
                <Input
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                  placeholder={t("e.g., 2x daily")}
                />
              </div>
            </div>
            <div>
              <Label>{t("Times (HH:mm, comma-separated)")}</Label>
              <Input
                value={editForm.timesInput}
                onChange={(e) => setEditForm({ ...editForm, timesInput: e.target.value })}
                placeholder={t("08:00, 20:00")}
              />
            </div>
            <div>
              <Label>{t("Notes (optional)")}</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder={t("e.g., take after food")}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
              <Label className="text-sm">{t("Reminder Active")}</Label>
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <Label className="text-sm font-medium">{t("Notify me at")}</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editForm.reminderOffsets.includes(-10)}
                    onCheckedChange={(v) => toggleOffset(-10, Boolean(v))}
                  />
                  <span>{t("10 minutes before")}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editForm.reminderOffsets.includes(-5)}
                    onCheckedChange={(v) => toggleOffset(-5, Boolean(v))}
                  />
                  <span>{t("5 minutes before")}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editForm.reminderOffsets.includes(0)}
                    onCheckedChange={(v) => toggleOffset(0, Boolean(v))}
                  />
                  <span>{t("At exact time")}</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={saving}>
              {t("Cancel")}
            </Button>
            <Button type="button" onClick={() => void handleCreateReminder()} disabled={saving}>
              {saving ? t("Saving...") : t("Create Reminder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingReminder(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle>{t("Edit Reminder")}</DialogTitle>
            <DialogDescription>{t("Update medicine details and reminder times.")}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div>
              <Label>{t("Medication Name")}</Label>
              <Input
                value={editForm.medication_name}
                onChange={(e) => setEditForm({ ...editForm, medication_name: e.target.value })}
                placeholder={t("e.g., Paracetamol")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("Dosage")}</Label>
                <Input
                  value={editForm.dosage}
                  onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                  placeholder={t("e.g., 500mg")}
                />
              </div>
              <div>
                <Label>{t("Frequency")}</Label>
                <Input
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                  placeholder={t("e.g., 2x daily")}
                />
              </div>
            </div>
            <div>
              <Label>{t("Times (HH:mm, comma-separated)")}</Label>
              <Input
                value={editForm.timesInput}
                onChange={(e) => setEditForm({ ...editForm, timesInput: e.target.value })}
                placeholder={t("08:00, 20:00")}
              />
            </div>
            <div>
              <Label>{t("Notes (optional)")}</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder={t("e.g., take after food")}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
              <Label className="text-sm">{t("Reminder Active")}</Label>
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <Label className="text-sm font-medium">{t("Notify me at")}</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editForm.reminderOffsets.includes(-10)}
                    onCheckedChange={(v) => toggleOffset(-10, Boolean(v))}
                  />
                  <span>{t("10 minutes before")}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editForm.reminderOffsets.includes(-5)}
                    onCheckedChange={(v) => toggleOffset(-5, Boolean(v))}
                  />
                  <span>{t("5 minutes before")}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editForm.reminderOffsets.includes(0)}
                    onCheckedChange={(v) => toggleOffset(0, Boolean(v))}
                  />
                  <span>{t("At exact time")}</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditingReminder(null);
              }}
              disabled={saving}
            >
              {t("Cancel")}
            </Button>
            <Button type="button" onClick={() => void handleSaveEdit()} disabled={saving}>
              {saving ? t("Saving...") : t("Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PdfBottomSheet
        open={pdfSheetOpen}
        onOpenChange={setPdfSheetOpen}
        url={pdfUrl}
        title={pdfTitle || t("Prescription PDF")}
      />
    </PatientLayout>
  );
};

export default PatientReminders;
