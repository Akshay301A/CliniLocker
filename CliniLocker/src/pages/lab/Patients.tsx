import { useState, useEffect } from "react";
import { LabLayout } from "@/components/LabLayout";
import { Preloader } from "@/components/Preloader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { getLabPatients } from "@/lib/api";

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

const LabPatients = () => {
  const { labId } = useAuth();
  const [patients, setPatients] = useState<{ patient_name: string; patient_phone: string; reports_count: number; last_report_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!labId) return;
    let mounted = true;
    getLabPatients(labId).then((data) => {
      if (mounted) {
        setPatients(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [labId]);

  if (loading) {
    return (
      <LabLayout>
        <Preloader />
      </LabLayout>
    );
  }

  return (
    <LabLayout>
      <div className="animate-fade-in">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Patients</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">All patients who have received reports.</p>
        <div className="mt-6 hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Reports</TableHead>
                <TableHead>Last Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.patient_phone}>
                  <TableCell className="font-medium">{p.patient_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.patient_phone}</TableCell>
                  <TableCell className="text-center">{p.reports_count}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.last_report_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-6 md:hidden space-y-3">
          {patients.map((p) => (
            <div key={p.patient_phone} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="font-medium text-foreground">{p.patient_name ?? "—"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{p.patient_phone}</p>
              <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                <span>{p.reports_count} reports</span>
                <span>Last: {formatDate(p.last_report_at)}</span>
              </div>
            </div>
          ))}
        </div>
        {patients.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            No patients yet. Upload a report to add one.
          </div>
        )}
      </div>
    </LabLayout>
  );
};

export default LabPatients;
