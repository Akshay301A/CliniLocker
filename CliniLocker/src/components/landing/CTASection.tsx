import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="cta" className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 glossy-btn opacity-90" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-primary-foreground leading-tight">
            Ready to Store Medical Reports Online?
          </h2>
          <p className="text-base sm:text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Create your CliniLocker account, upload lab reports and prescriptions, and share instantly with doctors or family.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="/signup"
              className="bg-card text-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg inline-flex items-center gap-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group justify-center"
            >
              Get Started (Labs)
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/patient-login"
              className="border-2 border-primary-foreground/30 text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-primary-foreground/10 transition-all duration-300 text-center"
            >
              Access My Reports
            </a>
          </div>
          <p className="text-primary-foreground/60 text-sm">Secure, private, and accessible anytime.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
