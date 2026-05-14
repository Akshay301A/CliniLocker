import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Clock, Edit, Pill, Plus, Trash2 } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { createMedicationReminder, getMedicationReminders, updateMedicationReminder, deleteMedicationReminder } from "@/lib/api";

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
};

type EditFormState = {
  medication_name: string;
  dosage: string;
  frequency: string;
  timesInput: string;
  notes: string;
  is_active: boolean;
};

const PatientReminders = () => {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderRow | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    medication_name: "",
    dosage: "",
    frequency: "",
    timesInput: "",
    notes: "",
    is_active: true,
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

  const parseTimes = (value: string): string[] =>
    value.split(",").map((item) => item.trim()).filter(Boolean);

  const hasValidTimes = (times: string[]): boolean =>
    !times.length || times.every((time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time));

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
    });
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
      toast.success(t("Reminder created successfully!"));
      setIsCreateOpen(false);
      resetCreateForm();
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

    setSaving(true);
    try {
      const result = await updateMedicationReminder(editingReminder.id, {
        medication_name: editForm.medication_name.trim(),
        dosage: editForm.dosage.trim(),
        frequency: editForm.frequency.trim(),
        times,
        notes: editForm.notes.trim(),
        is_active: editForm.is_active,
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
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
    const result = await deleteMedicationReminder(reminder.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("Reminder deleted successfully!"));
    await loadReminders();
  };

  const handleToggleActive = async (reminder: ReminderRow) => {
    const result = await updateMedicationReminder(reminder.id, { is_active: !reminder.is_active });
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    await loadReminders();
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 font-display text-xl font-bold text-foreground md:text-2xl">
                <Pill className="h-6 w-6 text-primary md:h-7 md:w-7" />
                {t("Medication Reminders")}
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
                {t("Manage your medication reminders. Edit times, dosages, or deactivate reminders.")}
              </p>
            </div>
            <Button type="button" className="h-11 w-full gap-2 rounded-2xl px-4 text-sm shadow-sm sm:h-10 sm:w-auto sm:rounded-xl" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>{t("Add Reminder")}</span>
            </Button>
          </div>
          <div className="mt-3">
            <Badge variant="secondary" className="rounded-lg px-3 py-1 text-xs">
              {reminderCountText}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button type="button" className="h-11 w-full rounded-2xl sm:w-auto" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("Add Reminder")}
              </Button>
              <Link to="/patient/upload" className="w-full sm:w-auto">
                <Button variant="outline" className="h-11 w-full rounded-2xl sm:w-auto">
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
                className={`rounded-2xl border border-border/60 bg-card p-4 shadow-md transition-shadow hover:shadow-lg md:p-5 ${!reminder.is_active ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${reminder.is_active ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-muted"}`}>
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-foreground md:text-lg">{reminder.medication_name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground md:text-sm">{reminder.dosage} | {reminder.frequency}</p>
                        {reminder.times && reminder.times.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <Clock className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-primary">{reminder.times.join(", ")}</span>
                          </div>
                        )}
                        {reminder.notes && <p className="mt-2 text-xs italic text-muted-foreground">{reminder.notes}</p>}
                        {reminder.start_date && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {t("Started")}: {new Date(reminder.start_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant={reminder.is_active ? "default" : "secondary"} className="rounded-md">
                            {reminder.is_active ? t("Active") : t("Paused")}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">{t("Notify")}</Label>
                            <Switch checked={reminder.is_active !== false} onCheckedChange={() => void handleToggleActive(reminder)} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(reminder)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => void handleDelete(reminder)}>
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle>{t("Add Reminder")}</DialogTitle>
            <DialogDescription>{t("Create a medication reminder manually.")}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div>
              <Label>{t("Medication Name")}</Label>
              <Input value={editForm.medication_name} onChange={(e) => setEditForm({ ...editForm, medication_name: e.target.value })} placeholder={t("e.g., Paracetamol")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("Dosage")}</Label>
                <Input value={editForm.dosage} onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })} placeholder={t("e.g., 500mg")} />
              </div>
              <div>
                <Label>{t("Frequency")}</Label>
                <Input value={editForm.frequency} onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })} placeholder={t("e.g., 2x daily")} />
              </div>
            </div>
            <div>
              <Label>{t("Times (HH:mm, comma-separated)")}</Label>
              <Input value={editForm.timesInput} onChange={(e) => setEditForm({ ...editForm, timesInput: e.target.value })} placeholder={t("08:00, 20:00")} />
            </div>
            <div>
              <Label>{t("Notes (optional)")}</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder={t("e.g., take after food")} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
              <Label className="text-sm">{t("Reminder Active")}</Label>
              <Switch checked={editForm.is_active} onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })} />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={saving}>{t("Cancel")}</Button>
            <Button type="button" onClick={() => void handleCreateReminder()} disabled={saving}>{saving ? t("Saving...") : t("Create Reminder")}</Button>
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
              <Input value={editForm.medication_name} onChange={(e) => setEditForm({ ...editForm, medication_name: e.target.value })} placeholder={t("e.g., Paracetamol")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("Dosage")}</Label>
                <Input value={editForm.dosage} onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })} placeholder={t("e.g., 500mg")} />
              </div>
              <div>
                <Label>{t("Frequency")}</Label>
                <Input value={editForm.frequency} onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })} placeholder={t("e.g., 2x daily")} />
              </div>
            </div>
            <div>
              <Label>{t("Times (HH:mm, comma-separated)")}</Label>
              <Input value={editForm.timesInput} onChange={(e) => setEditForm({ ...editForm, timesInput: e.target.value })} placeholder={t("08:00, 20:00")} />
            </div>
            <div>
              <Label>{t("Notes (optional)")}</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder={t("e.g., take after food")} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
              <Label className="text-sm">{t("Reminder Active")}</Label>
              <Switch checked={editForm.is_active} onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })} />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditingReminder(null); }} disabled={saving}>{t("Cancel")}</Button>
            <Button type="button" onClick={() => void handleSaveEdit()} disabled={saving}>{saving ? t("Saving...") : t("Save Changes")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PatientLayout>
  );
};

export default PatientReminders;
