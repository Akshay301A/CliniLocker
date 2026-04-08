import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroHealth from "@/assets/landing/hero-health.jpg";
import appMockup from "@/assets/landing/app-mockup.png";

const posts = [
  {
    title: "What is a Health Record Locker? The 2026 Guide to Digital Health in India",
    description:
      "Understand ABHA ID, PHR, consent-based sharing, and how encrypted lockers protect your medical records.",
    href: "/blogs/health-record-locker-2026",
    tag: "Definition",
    image: heroHealth,
  },
  {
    title: "CliniLocker vs. Physical Medical Files: 5 Reasons to Switch",
    description:
      "A quick comparison of security, access, and sharing — plus a pros and cons table for patients and clinics.",
    href: "/blogs/clinilocker-vs-physical-medical-files",
    tag: "Comparison",
    image: appMockup,
  },
];

const BlogsSection = () => {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="blogs" className="py-16 sm:py-20 lg:py-24 bg-background relative overflow-hidden">
      <div className="absolute -top-10 right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-14"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">Blogs</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-4 mb-4">
            Learn how health record lockers work in India
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Clear guides to ABHA, PHR, and why moving from paper files to a digital health locker matters.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post, index) => (
            <motion.div
              key={post.href}
              initial={{ opacity: 0, y: 24 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group rounded-3xl border border-border/60 bg-white/80 shadow-[0_18px_50px_rgba(16,24,40,0.08)] overflow-hidden backdrop-blur-lg"
            >
              <div className="h-44 sm:h-56 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 sm:p-8 space-y-4">
                <span className="inline-flex items-center rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {post.tag}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  {post.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
                <Link
                  to={post.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                >
                  Read the guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogsSection;
