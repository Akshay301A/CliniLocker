import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Shield, Share2, Bell, Activity, Users } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Report Vault",
    description: "Store lab reports, prescriptions, and imaging in a secure personal locker.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Encryption, access control, and safe sharing keep your data protected.",
  },
  {
    icon: Share2,
    title: "Share Links",
    description: "Create secure report links for doctors or family in seconds.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Medication and report reminders arrive right on time.",
  },
  {
    icon: Activity,
    title: "Report Insights",
    description: "AI summaries help you understand results quickly and clearly.",
  },
  {
    icon: Users,
    title: "Family Profiles",
    description: "Keep separate profiles for parents, kids, and caregivers with shared access.",
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
      className="group glass-card rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl glossy-btn flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
        <feature.icon className="w-7 h-7 text-primary-foreground" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">{feature.title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
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
            Everything You Need for Reports & Prescriptions
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Built for patients, families, and labs to organize, share, and stay on top of care.
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
