import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Download, Smartphone, Star } from "lucide-react";
import appMockup from "@/assets/landing/app-mockup.png";

const ANDROID_APK_PATH = "/downloads/CliniLocker-Android-v1.0.0-release.apk";
const ANDROID_APP_VERSION = "1.0.0";

const AppDownloadSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="app" className="py-16 sm:py-20 lg:py-24 relative overflow-hidden" style={{ background: "var(--gradient-dark)" }}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 glossy-btn rounded-full blur-3xl opacity-20 scale-75" />
              <img
                src={appMockup}
                alt="CliniLocker mobile app interface"
                loading="lazy"
                width={800}
                height={1200}
                className="relative w-64 sm:w-72 lg:w-96 floating drop-shadow-2xl"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-8"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Mobile App</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight" style={{ color: "hsl(0 0% 95%)" }}>
              Download CliniLocker {" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                for Android (India)
              </span>
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: "hsl(200 10% 60%)" }}>
              The medical records app for Android that lets you store reports online, scan documents, receive reminders,
              and share instantly. Android only - direct APK download.
            </p>

            <div className="flex items-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold" style={{ color: "hsl(0 0% 90%)" }}>4.9</span>
              <span style={{ color: "hsl(200 10% 50%)" }}>- Android users</span>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <a
                href={ANDROID_APK_PATH}
                download
                className="flex items-center gap-3 bg-card/10 hover:bg-card/20 border border-border/20 rounded-xl px-5 sm:px-6 py-3 transition-all duration-300 hover:-translate-y-1 group w-full sm:w-auto"
              >
                <Smartphone className="w-8 h-8" style={{ color: "hsl(0 0% 90%)" }} />
                <div className="text-left">
                  <p className="text-xs" style={{ color: "hsl(200 10% 50%)" }}>Android only</p>
                  <p className="font-semibold text-lg" style={{ color: "hsl(0 0% 95%)" }}>
                    Download APK v{ANDROID_APP_VERSION}
                  </p>
                </div>
                <Download className="w-5 h-5 text-primary-foreground opacity-80" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
