import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, FileText } from "lucide-react";
import heroImage from "@/assets/landing/hero-health.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center section-gradient overflow-hidden pt-20">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Trusted digital health locker</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight text-foreground">
              Your Health Reports,{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                Organized & Secure
              </span>{" "}
              in CliniLocker
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Store lab reports, prescriptions, and reminders in one place. Share with doctors or family in seconds,
              and access everything safely from web or Android.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <a href="/signup" className="glossy-btn text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg inline-flex items-center gap-2 group justify-center">
                Get Started (Labs)
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/patient-login" className="glass-card px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-foreground hover:bg-muted/80 transition-colors inline-flex items-center gap-2 justify-center">
                Access My Reports
              </a>
            </div>

            {/* Mini feature pills */}
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-4">
              {[
                { icon: Shield, label: "Secure Vault" },
                { icon: Clock, label: "24/7 Access" },
                { icon: FileText, label: "Instant Sharing" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-full border border-border/50 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden" style={{ boxShadow: "var(--shadow-elevated)" }}>
              <img
                src={heroImage}
                alt="Healthcare professionals with patients in modern clinic"
                width={1920}
                height={1080}
                className="w-full h-auto object-cover rounded-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent rounded-3xl" />
            </div>

            {/* Floating glass cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 glass-card rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl glossy-btn flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">256-bit Encrypted</p>
                <p className="text-xs text-muted-foreground">Bank-grade security</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -top-4 -right-4 glass-card rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Instant Access</p>
                <p className="text-xs text-muted-foreground">To all records</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
