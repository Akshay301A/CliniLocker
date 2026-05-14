import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { PatientLayout } from "@/components/PatientLayout";
import { useAbhaStore } from "@/lib/abhaStore";

export default function AbhaRecordViewer() {
  const { id } = useParams();
  const { medicalRecords } = useAbhaStore();

  const record = useMemo(() => medicalRecords.find((r) => r.id === id), [medicalRecords, id]);

  return (
    <PatientLayout>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-blue-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0055BB]">ABHA Verified</p>
          <h1 className="mt-2 text-2xl font-bold">{record?.title || "Health Record"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Structured report from National Health Gateway.</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          {!record?.fhir ? (
            <p className="text-sm text-muted-foreground">No structured data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Test Name</th>
                    <th className="px-3 py-2 text-left">Result</th>
                    <th className="px-3 py-2 text-left">Range</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {record.fhir.map((row) => (
                    <tr key={row.testName}>
                      <td className="px-3 py-2 font-semibold text-foreground">{row.testName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.result}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.range}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            row.status === "Normal"
                              ? "bg-emerald-50 text-emerald-700"
                              : row.status === "Attention"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Link to="/patient/abha/timeline" className="text-sm font-semibold text-[#0055BB]">
          Back to timeline
        </Link>
      </div>
    </PatientLayout>
  );
}
