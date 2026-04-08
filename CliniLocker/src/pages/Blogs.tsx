import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import heroHealth from "@/assets/landing/hero-health.jpg";
import appMockup from "@/assets/landing/app-mockup.png";

const posts = [
  {
    title: "What is a Health Record Locker? The 2026 Guide to Digital Health in India",
    description:
      "A clear definition of health record lockers in the ABDM ecosystem: ABHA ID, PHR, consent, and encryption.",
    href: "/blogs/health-record-locker-2026",
    tag: "Definition",
    image: heroHealth,
  },
  {
    title: "CliniLocker vs. Physical Medical Files: 5 Reasons to Switch",
    description:
      "Compare security, access, and sharing with a clean pros-and-cons table and practical examples.",
    href: "/blogs/clinilocker-vs-physical-medical-files",
    tag: "Comparison",
    image: appMockup,
  },
];

const Blogs = () => {
  useEffect(() => {
    document.title = "CliniLocker Blog | Health Record Locker Guides";
  }, []);

  return (
    <div className="landing-theme min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">CliniLocker Blog</span>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
                Health record locker guides for India
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                Practical, easy-to-read explanations of ABHA, PHR, consent-based sharing, and why digital health
                lockers are replacing physical medical files.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.href}
                  className="group rounded-3xl border border-border/60 bg-white/80 shadow-[0_18px_50px_rgba(16,24,40,0.08)] overflow-hidden"
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
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      {post.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {post.description}
                    </p>
                    <Link
                      to={post.href}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      Read the guide
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blogs;
