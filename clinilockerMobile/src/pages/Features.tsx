import { PublicLayout } from "@/components/PublicLayout";
import { Shield, Share2, Lock, Cloud, Smartphone, BarChart3, Users, FileText } from "lucide-react";

const features = [
  { icon: Share2, title: "Instant Report Sharing", desc: "Generate secure links and share reports with patients instantly via SMS or WhatsApp." },
  { icon: Lock, title: "Secure Patient Vault", desc: "All reports are encrypted at rest and in transit. Each patient has their own secure vault." },
  { icon: Smartphone, title: "WhatsApp & SMS Delivery", desc: "Automatically notify patients when their report is ready via their preferred channel." },
  { icon: Cloud, title: "Cloud-Based Storage", desc: "No more local storage headaches. Everything is safely stored in the cloud." },
  { icon: BarChart3, title: "Lab Analytics", desc: "Track report volumes, patient engagement, and lab performance with built-in analytics." },
  { icon: Users, title: "Patient Management", desc: "Maintain a complete directory of patients with their report history." },
  { icon: FileText, title: "PDF Report Viewer", desc: "Patients can view and download reports directly from their browser — no app needed." },
  { icon: Shield, title: "Role-Based Access", desc: "Separate dashboards for labs and patients with appropriate access controls." },
];

const FeaturesPage = () => (
  <PublicLayout>
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">Features</h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground px-2">
            Everything you need to manage, share, and secure medical reports.
          </p>
        </div>
        <div className="mt-8 sm:mt-12 md:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card transition-all hover:shadow-hover">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default FeaturesPage;
