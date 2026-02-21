import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pill, Bell, Edit, Trash2, Plus, Clock, Calendar } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMedicationReminders, updateMedicationReminder, deleteMedicationReminder } from "@/lib/api";

const PatientReminders = () => {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    times: [] as string[],
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    const data = await getMedicationReminders();
    setReminders(data);
    setLoading(false);
  };

  const handleEdit = (reminder: any) => {
    setEditingReminder(reminder);
    setEditForm({
      medication_name: reminder.medication_name || "",
      dosage: reminder.dosage || "",
      frequency: reminder.frequency || "",
      times: reminder.times || [],
      notes: reminder.notes || "",
      is_active: reminder.is_active !== false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReminder) return;
    if (!editForm.medication_name.trim() || !editForm.dosage.trim() || !editForm.frequency.trim()) {
      toast.error(t("Please fill in all required fields."));
      return;
    }

    // Cancel old notifications if times changed or reminder deactivated
    if (editingReminder.times && editingReminder.times.length > 0) {
      const { cancelMedicationReminder } = await import("@/lib/notifications");
      await cancelMedicationReminder(editingReminder.id, editingReminder.times);
    }

    const result = await updateMedicationReminder(editingReminder.id, editForm);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    // Schedule new notifications if reminder is active and has times
    if (editForm.is_active && editForm.times && editForm.times.length > 0) {
      const { scheduleMedicationReminder } = await import("@/lib/notifications");
      await scheduleMedicationReminder(
        editingReminder.id,
        editForm.medication_name,
        editForm.dosage,
        editForm.times,
        editingReminder.start_date || new Date().toISOString().split('T')[0],
        editingReminder.duration_days
      );
    }

    toast.success(t("Reminder updated successfully!"));
    setEditingReminder(null);
    loadReminders();
  };

  const handleDelete = async (reminder: any) => {
    if (!confirm(t("Are you sure you want to delete this reminder?"))) return;
    
    // Cancel notifications before deleting
    if (reminder.times && reminder.times.length > 0) {
      const { cancelMedicationReminder } = await import("@/lib/notifications");
      await cancelMedicationReminder(reminder.id, reminder.times);
    }
    
    const result = await deleteMedicationReminder(reminder.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(t("Reminder deleted successfully!"));
    loadReminders();
  };

  const handleToggleActive = async (reminder: any) => {
    const newActiveState = !reminder.is_active;
    
    if (newActiveState && reminder.times && reminder.times.length > 0) {
      // Activating - schedule notifications
      const { scheduleMedicationReminder } = await import("@/lib/notifications");
      await scheduleMedicationReminder(
        reminder.id,
        reminder.medication_name,
        reminder.dosage,
        reminder.times,
        reminder.start_date || new Date().toISOString().split('T')[0],
        reminder.duration_days
      );
    } else if (!newActiveState && reminder.times && reminder.times.length > 0) {
      // Deactivating - cancel notifications
      const { cancelMedicationReminder } = await import("@/lib/notifications");
      await cancelMedicationReminder(reminder.id, reminder.times);
    }
    
    const result = await updateMedicationReminder(reminder.id, { is_active: newActiveState });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    loadReminders();
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-4 md:space-y-5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Pill className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              {t("Medication Reminders")}
            </h1>
            <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">
              {t("Manage your medication reminders. Edit times, dosages, or deactivate reminders.")}
            </p>
          </div>
          <Link to="/patient/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("Add Prescription")}
            </Button>
          </Link>
        </div>

        {reminders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center">
            <Pill className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t("No reminders yet")}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("Upload a prescription to automatically create medication reminders.")}
            </p>
            <Link to="/patient/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("Upload Prescription")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`rounded-xl border border-border/60 bg-card p-4 md:p-5 shadow-md ${
                  !reminder.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    reminder.is_active 
                      ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                      : "bg-muted"
                  } text-white shadow-md`}>
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base md:text-lg text-foreground">
                          {reminder.medication_name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                          {reminder.dosage} • {reminder.frequency}
                        </p>
                        {reminder.times && reminder.times.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-primary" />
                            <span className="text-xs text-primary font-medium">
                              {reminder.times.join(", ")}
                            </span>
                          </div>
                        )}
                        {reminder.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">{reminder.notes}</p>
                        )}
                        {reminder.start_date && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t("Started")}: {new Date(reminder.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(reminder)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{t("Edit Reminder")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label>{t("Medication Name")}</Label>
                                <Input
                                  value={editForm.medication_name}
                                  onChange={(e) => setEditForm({ ...editForm, medication_name: e.target.value })}
                                  placeholder={t("e.g., Paracetamol")}
                                />
                              </div>
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
                                  placeholder={t("e.g., 2 times daily")}
                                />
                              </div>
                              <div>
                                <Label>{t("Times (comma-separated, e.g., 08:00, 20:00)")}</Label>
                                <Input
                                  value={editForm.times.join(", ")}
                                  onChange={(e) => setEditForm({ 
                                    ...editForm, 
                                    times: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                                  })}
                                  placeholder={t("08:00, 20:00")}
                                />
                              </div>
                              <div>
                                <Label>{t("Notes (optional)")}</Label>
                                <Input
                                  value={editForm.notes}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                  placeholder={t("e.g., with food")}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="is_active"
                                  checked={editForm.is_active}
                                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">
                                  {t("Active")}
                                </Label>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleSaveEdit} className="flex-1">
                                  {t("Save")}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingReminder(null)}
                                  className="flex-1"
                                >
                                  {t("Cancel")}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(reminder)}
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
    </PatientLayout>
  );
};

export default PatientReminders;
