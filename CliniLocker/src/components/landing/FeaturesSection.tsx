import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Shield, Share2, Bell, Activity, Users, Utensils, Sparkles, HeartPulse } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Report Vault",
    description: "Store lab reports, prescriptions, and imaging in a secure personal locker.",
    tags: ["PDFs", "Prescriptions", "Imaging"],
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Encryption, access control, and safe sharing keep your data protected.",
    tags: ["Encryption", "Access Control"],
  },
  {
    icon: Share2,
    title: "Share Links",
    description: "Create secure report links for doctors or family in seconds.",
    tags: ["Doctor-ready", "Instant"],
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Medication and report reminders arrive right on time.",
    tags: ["On-time", "Custom"],
  },
  {
    icon: Sparkles,
    title: "AI Summary (On-demand)",
    description: "Generate a clear, simple summary when you choose — no auto surprises.",
    tags: ["Explain", "Actionable"],
    highlight: true,
  },
  {
    icon: Utensils,
    title: "AI Diet Plans",
    description: "Personalized diet plans based on report values with budget and diet preferences.",
    tags: ["Budget", "Veg/Non‑veg"],
    highlight: true,
  },
  {
    icon: Activity,
    title: "Health Insights",
    description: "Key ranges and attention areas are surfaced in patient‑friendly language.",
    tags: ["Normal/Attention", "Easy to read"],
  },
  {
    icon: HeartPulse,
    title: "Lifestyle Guidance",
    description: "Practical next steps and habits suggested from your report data.",
    tags: ["Daily tips", "Follow‑ups"],
  },
  {
    icon: Users,
    title: "Family Profiles",
    description: "Keep separate profiles for parents, kids, and caregivers with shared access.",
    tags: ["Shared access", "Invites"],
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="group relative overflow-hidden rounded-3xl border border-border/60 bg-white/80 p-6 sm:p-8 shadow-[0_18px_50px_rgba(16,24,40,0.08)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(16,24,40,0.14)]"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
          {feature.tags?.[0] ?? "CliniLocker"}
        </div>
        {feature.highlight && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            New
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/25">
          <feature.icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">{feature.title}</h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(feature.tags ?? []).slice(1).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border/60 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary/80">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {feature.highlight ? "AI-powered upgrade" : "Included by default"}
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-background relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-32 top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">Features</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-4 mb-6">
            All‑in‑one care tools for patients & families
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Organize reports, generate AI insights, build diet plans, and share securely — all in one place.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
