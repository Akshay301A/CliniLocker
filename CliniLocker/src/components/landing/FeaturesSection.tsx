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
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
        feature.highlight
          ? "glass-card ring-1 ring-primary/20 bg-gradient-to-br from-white/90 via-white/70 to-primary/10"
          : "glass-card"
      }`}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl glossy-btn flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
        <feature.icon className="w-7 h-7 text-primary-foreground" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">{feature.title}</h3>
        {feature.highlight && (
          <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full bg-primary/10 text-primary px-2 py-0.5">
            New
          </span>
        )}
      </div>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
      <div className="flex flex-wrap gap-2">
        {(feature.tags ?? []).map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-semibold rounded-full border border-border px-2.5 py-1 text-muted-foreground bg-white/70"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-background relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">Features</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-4 mb-6">
            All‑in‑one care tools for patients & families
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Organize reports, generate AI insights, build diet plans, and share securely — all in one place.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
