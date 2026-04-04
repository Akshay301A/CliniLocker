import { ArrowRight, Building2, Mail, ShieldCheck, Stethoscope, Users, Zap } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const HmsComingSoon = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28">
        <section className="relative overflow-hidden">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/10 blur-3xl rounded-full" />
          <div className="absolute top-40 right-0 w-[520px] h-[520px] bg-accent/15 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-secondary/10 blur-3xl rounded-full" />

          <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">CliniLocker HMS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground">
                A modern HMS for small clinics,
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  {" "}launching soon
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                We are building a lightweight hospital management system that gets your clinic paperless in minutes.
                Simple workflows, zero clutter, and secure patient access — designed for real-world teams.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href="/signup"
                  className="glossy-btn text-primary-foreground px-6 sm:px-8 py-3.5 rounded-full font-semibold inline-flex items-center gap-2"
                >
                  Join early access
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="mailto:support@clinilocker.com"
                  className="glass-card px-6 sm:px-8 py-3.5 rounded-full font-semibold text-foreground inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact us
                </a>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                {[
                  { icon: Zap, title: "10‑min setup", desc: "Start using immediately" },
                  { icon: Users, title: "Team friendly", desc: "Made for receptionists" },
                  { icon: Stethoscope, title: "Doctor ready", desc: "Fast visit flow" },
                  { icon: ShieldCheck, title: "Secure by design", desc: "Patient data protected" },
                ].map((item) => (
                  <div key={item.title} className="glass-card rounded-2xl p-4 text-left space-y-2">
                    <div className="w-10 h-10 rounded-xl glossy-btn flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 glass-card rounded-3xl p-6 sm:p-8 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-widest text-muted-foreground">What’s coming</p>
                    <p className="text-xl font-bold text-foreground">HMS modules, staged rollout</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">Private beta soon</span>
                </div>
                <div className="mt-6 grid sm:grid-cols-3 gap-4">
                  {[
                    { step: "01", title: "Patients & visits", desc: "Register patients, create visits fast." },
                    { step: "02", title: "Prescriptions & reports", desc: "Generate, print, and share." },
                    { step: "03", title: "Billing & payments", desc: "Simple billing for small clinics." },
                  ].map((item) => (
                    <div key={item.step} className="rounded-2xl border border-border/40 bg-background/60 p-4">
                      <p className="text-xs font-bold text-muted-foreground">STEP {item.step}</p>
                      <p className="mt-2 font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HmsComingSoon;
