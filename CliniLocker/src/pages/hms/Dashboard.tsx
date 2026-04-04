import { HmsLayout } from "@/components/hms/HmsLayout";
import { CalendarPlus, Filter, MoreHorizontal } from "lucide-react";

const Dashboard = () => {
  return (
    <HmsLayout>
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Dashboard</h2>
          <p className="text-on-surface-variant/70">
            Welcome back. You have 3 urgent reports to review today.
          </p>
        </div>
        <button className="bg-surface-container-lowest text-on-surface px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-outline-variant/10 shadow-sm hover:bg-surface-container-low transition-all">
          <CalendarPlus className="h-4 w-4" />
          New Visit
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Today's Patients", value: "32", badge: "+12% vs last week", badgeColor: "text-secondary bg-secondary-container/20" },
          { label: "Upcoming Visits", value: "12", badge: "Standard Load", badgeColor: "text-on-surface-variant bg-surface-container-high" },
          { label: "Pending Bills", value: "5", badge: "Action Required", badgeColor: "text-error bg-error-container/40" },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-lg" />
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{card.label}</p>
              <p className="text-4xl font-extrabold tracking-tighter mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,88,188,0.06)] overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">Recent Patients</h3>
          <div className="flex gap-2 items-center">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
              <Filter className="h-4 w-4" />
            </button>
            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Patient Name</th>
                <th className="px-8 py-4">Patient ID</th>
                <th className="px-8 py-4">Last Visit</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface-variant/5">
              {[
                { name: "Aditi Mishra", id: "CL-2024-883", last: "Oct 24, 2023", status: "Stable", statusClass: "bg-secondary-container text-on-secondary-container" },
                { name: "Rahul Kapoor", id: "CL-2024-912", last: "Oct 23, 2023", status: "Critical", statusClass: "bg-error-container text-on-error-container" },
                { name: "Sarah Lewis", id: "CL-2024-441", last: "Oct 22, 2023", status: "Follow-up", statusClass: "bg-surface-container-high text-on-surface-variant" },
              ].map((row) => (
                <tr key={row.id} className="group hover:bg-surface-container/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">
                        {row.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{row.name}</p>
                        <p className="text-xs text-on-surface-variant/60">{row.name.toLowerCase().replace(" ", ".")}@email.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-mono text-xs text-on-surface-variant">{row.id}</td>
                  <td className="px-8 py-5 text-sm text-on-surface-variant">{row.last}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${row.statusClass}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </HmsLayout>
  );
};

export default Dashboard;

