import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CirclePlay, FileVideo, MonitorPlay } from "lucide-react";

const TUTORIAL_VIDEO_PATH = "/tutorial clinilocker.mp4";
const TUTORIAL_POSTER_PATH = "/preview.png";

const TutorialSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      className="py-16 sm:py-20 lg:py-24 relative overflow-hidden"
      style={{ background: "var(--gradient-dark)" }}
    >
      <div className="absolute top-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-8 order-2 lg:order-1"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">
              Product Walkthrough
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight"
              style={{ color: "hsl(0 0% 95%)" }}
            >
              Watch the {" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                CliniLocker Tutorial
              </span>
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: "hsl(200 10% 60%)" }}>
              A quick guided walkthrough of uploads, reminders, report sharing, and the patient dashboard so
              new users understand the app before downloading it.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/20 bg-card/10 px-4 py-4">
                <CirclePlay className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 92%)" }}>See the flow</p>
                <p className="text-xs mt-1" style={{ color: "hsl(200 10% 55%)" }}>From sign in to reports</p>
              </div>
              <div className="rounded-2xl border border-border/20 bg-card/10 px-4 py-4">
                <FileVideo className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 92%)" }}>Real screens</p>
                <p className="text-xs mt-1" style={{ color: "hsl(200 10% 55%)" }}>No generic demo slides</p>
              </div>
              <div className="rounded-2xl border border-border/20 bg-card/10 px-4 py-4">
                <MonitorPlay className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 92%)" }}>Begin faster</p>
                <p className="text-xs mt-1" style={{ color: "hsl(200 10% 55%)" }}>Learn before installing</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="order-1 lg:order-2"
          >
            <div className="mx-auto w-full max-w-[430px] rounded-[28px] border border-border/20 bg-card/10 p-3 sm:p-4 shadow-[0_24px_80px_rgba(3,8,20,0.35)] backdrop-blur-xl">
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/40">
                <video
                  className="w-full aspect-[4/5] object-cover object-top"
                  controls
                  preload="metadata"
                  playsInline
                  poster={TUTORIAL_POSTER_PATH}
                >
                  <source src={TUTORIAL_VIDEO_PATH} type="video/mp4" />
                </video>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TutorialSection;
