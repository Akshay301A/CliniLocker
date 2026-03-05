import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/PublicLayout";
import { Shield, Share2, Lock, Cloud, Smartphone, Upload, Link2, UserCheck, Check, Download, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const features = [
  { icon: Share2, title: "Instant Report Sharing", desc: "Share reports with patients via secure links in seconds." },
  { icon: Lock, title: "Secure Patient Vault", desc: "Every report is encrypted and stored safely in the cloud." },
  { icon: Smartphone, title: "WhatsApp/SMS Delivery", desc: "Deliver reports directly to patients' phones." },
  { icon: Cloud, title: "Cloud-Based Storage", desc: "Access reports from anywhere, anytime, on any device." },
];

const steps = [
  { icon: Upload, num: "01", title: "Upload Report", desc: "Upload the PDF report from your lab system." },
  { icon: Link2, num: "02", title: "Send Secure Link", desc: "A unique secure link is generated and sent to the patient." },
  { icon: UserCheck, num: "03", title: "Patient Accesses Anytime", desc: "Patients log in and access all reports from their portal." },
];

const ANDROID_APK_PATH = "/downloads/CliniLocker-Android-v1.0-release.apk";

const Index = () => {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container relative z-10 px-4 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="grid items-center gap-8 md:gap-12 md:grid-cols-2">
            <div className="animate-fade-in order-2 md:order-1">
              <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-primary">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                HIPAA-Compliant Platform
              </div>
              <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                Secure Digital Health Reports for Every Patient
              </h1>
              <p className="mt-3 sm:mt-4 max-w-lg text-base sm:text-lg text-muted-foreground">
                Upload, share, and manage medical reports in seconds. Built for diagnostic labs and trusted by patients.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col xs:flex-row flex-wrap gap-3">
                <Button size="lg" className="min-h-[44px] w-full xs:w-auto" asChild>
                  <Link to="/signup">Get Started for Labs</Link>
                </Button>
                <Button size="lg" variant="outline" className="min-h-[44px] w-full xs:w-auto" asChild>
                  <Link to="/patient-login">Access My Reports</Link>
                </Button>
              </div>
            </div>
            <div className="animate-fade-in order-1 md:order-2" style={{ animationDelay: "0.2s" }}>
              <img
                src={heroImage}
                alt="CliniLocker dashboard preview"
                className="w-full rounded-xl sm:rounded-2xl shadow-elevated"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
              Everything Labs Need
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
              A complete toolkit for modern diagnostic laboratories.
            </p>
          </div>
          <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-hover"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Android App Download */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-elevated sm:p-8 md:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  New: Android Mobile App
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src="/logo%20(2).png"
                    alt="CliniLocker Android App"
                    className="h-14 w-14 rounded-xl border border-white/20 bg-black/40 object-contain p-1"
                  />
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                      Download CliniLocker for Android
                    </h2>
                    <p className="mt-1 text-sm text-slate-200 sm:text-base">
                      Get faster access to reports, reminders, and prescriptions on your phone.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-emerald-200">
                    <Smartphone className="h-4 w-4" />
                    Android only
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-cyan-200">
                    <Shield className="h-4 w-4" />
                    Secure health vault
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:items-end">
                <Button
                  asChild
                  size="lg"
                  className="min-h-[48px] w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 md:w-auto"
                >
                  <a href={ANDROID_APK_PATH} download>
                    <Download className="mr-2 h-4 w-4" />
                    Android App APK
                  </a>
                </Button>
                <p className="text-[11px] text-slate-300">
                  Supports Android. iOS app coming later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-y border-border bg-muted/50 py-12 sm:py-16 md:py-20">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
              How It Works
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
              Three simple steps from upload to patient access.
            </p>
          </div>
          <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="relative rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8 shadow-card text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground font-display text-xl font-bold">
                  {s.num}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">Start free, upgrade when you need more.</p>
          </div>
          <div className="mx-auto mt-8 sm:mt-12 grid max-w-3xl gap-4 sm:gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8 shadow-card">
              <h3 className="font-display text-xl font-bold text-foreground">Free</h3>
              <p className="mt-1 text-sm text-muted-foreground">For small labs getting started</p>
              <div className="my-6">
                <span className="font-display text-4xl font-extrabold text-foreground">₹0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Up to 200 reports/month</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Secure patient links</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Basic dashboard</li>
              </ul>
              <Button variant="outline" className="mt-6 w-full" asChild>
                <Link to="/signup">Start Free</Link>
              </Button>
            </div>
            {/* Pro */}
            <div className="relative rounded-xl border-2 border-primary bg-card p-5 sm:p-6 md:p-8 shadow-elevated">
              <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                Popular
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Pro</h3>
              <p className="mt-1 text-sm text-muted-foreground">For growing labs and clinics</p>
              <div className="my-6">
                <span className="font-display text-4xl font-extrabold text-foreground">₹999</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Unlimited reports</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> WhatsApp delivery</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Priority support</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Advanced analytics</li>
              </ul>
              <Button className="mt-6 w-full" asChild>
                <Link to="/signup">Get Pro</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/50 py-12 sm:py-16 md:py-20">
        <div className="container px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Ready to Digitize Your Lab?
          </h2>
          <p className="mx-auto mt-2 sm:mt-3 max-w-md text-sm sm:text-base text-muted-foreground px-2">
            Join hundreds of labs already using CliniLocker to deliver reports faster and safer.
          </p>
          <Button size="lg" className="mt-6 sm:mt-8 min-h-[44px] w-full sm:w-auto" asChild>
            <Link to="/signup">Get Started for Free</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
