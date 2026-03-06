import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/PublicLayout";
import {
  Shield,
  Share2,
  Lock,
  Cloud,
  Smartphone,
  Upload,
  Link2,
  UserCheck,
  Check,
  Download,
  Sparkles,
  BellRing,
  Fingerprint,
  HeartPulse,
  ArrowRight,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const features = [
  {
    icon: Share2,
    title: "Instant Report Sharing",
    desc: "Send patient-safe links in seconds with zero manual follow-up.",
    tone: "from-cyan-500/20 to-blue-500/20 text-cyan-600",
  },
  {
    icon: Lock,
    title: "Encrypted Health Vault",
    desc: "Each report is stored with strict access control and auditability.",
    tone: "from-emerald-500/20 to-teal-500/20 text-emerald-600",
  },
  {
    icon: BellRing,
    title: "Smart Reminders",
    desc: "Medication and report alerts arrive at the right time on mobile.",
    tone: "from-amber-500/20 to-orange-500/20 text-amber-600",
  },
  {
    icon: Cloud,
    title: "Cloud Everywhere",
    desc: "Users can access reports securely across web and Android app.",
    tone: "from-violet-500/20 to-indigo-500/20 text-indigo-600",
  },
];

const steps = [
  { icon: Upload, num: "01", title: "Upload", desc: "Lab uploads report PDF in one step." },
  { icon: Link2, num: "02", title: "Share", desc: "CliniLocker sends secure access instantly." },
  { icon: UserCheck, num: "03", title: "Access", desc: "Patient views reports and reminders anytime." },
];

const ANDROID_APK_PATH = "/downloads/CliniLocker-Android-v1.0.3-release.apk";
const ANDROID_APP_VERSION = "1.0.3";

const Index = () => {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl" />

        <div className="container relative z-10 px-4 py-10 sm:py-14 md:py-20 lg:py-24">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
            <div className="animate-fade-in">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-blue-700 sm:text-sm">
                <Shield className="h-4 w-4" />
                Trusted Digital Health Platform
              </div>

              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[3.5rem]">
                Your Health Reports,
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {" "}
                  Organized and Actionable
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm text-slate-700 sm:text-base md:text-lg">
                CliniLocker helps labs and patients manage reports, prescriptions, reminders, and secure sharing in one modern platform.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" className="min-h-[48px] w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto" asChild>
                  <Link to="/signup">Get Started for Labs</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px] w-full border-blue-300 bg-white/80 text-blue-700 hover:bg-blue-50 sm:w-auto"
                  asChild
                >
                  <Link to="/patient-login">Access My Reports</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-blue-700 sm:text-sm">
                <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1.5">Privacy focused</span>
                <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1.5">Secure cloud storage</span>
                <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1.5">Labs + patients</span>
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                <div className="absolute -right-5 -top-5 hidden rounded-xl border border-cyan-200 bg-white/90 p-3 text-cyan-700 shadow-sm md:block">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Fingerprint className="h-4 w-4" />
                    Privacy First
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-blue-200 bg-white/90 p-3 text-blue-700 shadow-sm md:block">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <HeartPulse className="h-4 w-4" />
                    Smart Health Timeline
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-xl">
                  <img src={heroImage} alt="CliniLocker dashboard preview" className="w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-b from-sky-50 via-white to-sky-50">
        <section className="py-10 sm:py-14 md:py-20">
          <div className="container px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Core Features</p>
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">Built for Modern Care Delivery</h2>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">Powerful features designed for labs, families, and patients.</p>
            </div>

            <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group h-full rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.tone}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-20">
          <div className="container px-4">
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-700 p-4 shadow-2xl sm:rounded-3xl sm:p-6 md:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative grid items-center gap-5 md:grid-cols-[1fr_auto] md:gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  New: Android Mobile App
                </div>

                <div className="flex items-start gap-3 sm:items-center">
                  <img
                    src="/favicon.png"
                    alt="CliniLocker Android App"
                    className="h-12 w-12 rounded-xl border border-white/20 bg-white object-contain p-1 sm:h-14 sm:w-14"
                  />
                  <div>
                    <h2 className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">Download CliniLocker for Android</h2>
                    <p className="mt-1 text-sm text-slate-200 sm:text-base">
                      Get faster access to reports, reminders, and prescriptions on your phone.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-cyan-100">
                    <Smartphone className="h-4 w-4" />
                    Android only
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-cyan-200">
                    <Shield className="h-4 w-4" />
                    Secure health vault
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:min-w-[220px] md:items-end md:justify-end">
                <Button asChild size="lg" className="min-h-[48px] w-full bg-cyan-300 text-blue-900 hover:bg-cyan-200 md:w-auto">
                  <a href={ANDROID_APK_PATH} download>
                    <Download className="mr-2 h-4 w-4" />
                    Android App APK v{ANDROID_APP_VERSION}
                  </a>
                </Button>
                <p className="text-[11px] text-slate-300">Supports Android. iOS app coming later.</p>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="border-y border-blue-100 py-10 sm:py-14 md:py-20">
          <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Workflow</p>
            <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">How It Works</h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              A fast and secure journey from report upload to patient clarity.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.num} className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  Step {s.num}
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-emerald-100 text-cyan-700">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-slate-300" />
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="py-10 sm:py-14 md:py-20">
          <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Pricing</p>
            <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">Start free, scale as your lab grows.</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
              <h3 className="font-display text-xl font-bold text-slate-900">Free</h3>
              <p className="mt-1 text-sm text-slate-600">For labs getting started</p>
              <div className="my-6">
                <span className="font-display text-4xl font-extrabold text-slate-900">Rs 0</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Up to 200 reports/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Secure patient links
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Basic dashboard
                </li>
              </ul>
              <Button variant="outline" className="mt-6 w-full border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
                <Link to="/signup">Start Free</Link>
              </Button>
            </div>

            <div className="relative rounded-2xl border border-cyan-300 bg-gradient-to-b from-cyan-100 to-blue-100 p-5 shadow-lg sm:p-6 md:p-8">
              <div className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">Popular</div>
              <h3 className="font-display text-xl font-bold text-slate-900">Pro</h3>
              <p className="mt-1 text-sm text-slate-600">For growing labs and clinics</p>
              <div className="my-6">
                <span className="font-display text-4xl font-extrabold text-slate-900">Rs 999</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Unlimited reports
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> WhatsApp delivery
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Advanced analytics
                </li>
              </ul>
              <Button className="mt-6 w-full" asChild>
                <Link to="/signup">Get Pro</Link>
              </Button>
            </div>
          </div>
          </div>
        </section>
      </div>

      <section className="border-t border-blue-200 bg-gradient-to-r from-blue-800 to-cyan-700 py-10 sm:py-14 md:py-20">
        <div className="container px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">Ready to Digitize Your Lab?</h2>
          <p className="mx-auto mt-3 max-w-md px-2 text-sm text-slate-300 sm:text-base">
            Launch a modern patient experience with fast report delivery and trusted data security.
          </p>
          <Button size="lg" className="mt-6 min-h-[46px] w-full bg-white text-blue-800 hover:bg-blue-50 sm:mt-8 sm:w-auto" asChild>
            <Link to="/signup">Get Started for Free</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
