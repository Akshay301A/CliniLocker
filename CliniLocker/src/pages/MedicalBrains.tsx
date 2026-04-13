const advisors = [
  {
    name: "Dr. Prathyusha",
    degree: "BAMS",
    role: "Founding Advisor",
    initials: "DP",
    focus: "Integrative Ayurvedic Strategy",
  },
  {
    name: "Dr. Nikita PJ",
    degree: "BAMS",
    role: "Clinical Experience Lead",
    initials: "NP",
    focus: "Patient-Centric Care Design",
  },
  {
    name: "Dr. Anusha C",
    degree: "BAMS",
    role: "Integrative Health Lead",
    initials: "AC",
    focus: "Evidence-Based Protocols",
  },
  {
    name: "Dr. Nandhini Paladugula",
    degree: "BAMS",
    role: "Wellness Innovation Advisor",
    initials: "NP",
    focus: "Preventive Care Programs",
  },
  {
    name: "Dr. Sri Vedatrayi",
    degree: "BAMS",
    role: "Clinical Quality Lead",
    initials: "SV",
    focus: "Holistic Safety Standards",
  },
];

import Footer from "@/components/landing/Footer";
import { Activity, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";

const MedicalBrains = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#0c1b2a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#0047AB]/5 blur-3xl" />
        <div className="absolute top-32 right-[-80px] h-72 w-72 rounded-full bg-[#B2AC88]/12 blur-3xl" />
        <div className="absolute bottom-16 left-[10%] h-56 w-56 rounded-full bg-[#0047AB]/7 blur-2xl" />
        <div className="absolute left-24 top-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0047AB]/15 bg-white/80 text-[#0047AB] shadow-sm">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div className="absolute right-32 top-56 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0047AB]/15 bg-white/80 text-[#0047AB] shadow-sm">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div className="absolute left-[55%] bottom-24 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0047AB]/15 bg-white/80 text-[#0047AB] shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="absolute left-8 bottom-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0047AB]/15 bg-white/80 text-[#0047AB] shadow-sm">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      <nav className="sticky top-0 z-20 py-5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="w-full rounded-full bg-white/95 shadow-lg h-16 transition-all duration-300">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <a href="/" className="flex items-center gap-3">
                <img
                  src="/logo (2).png"
                  alt="CliniLocker logo"
                  className="h-35 w-[240px] object-contain"
                />
              </a>
              <div className="hidden items-center gap-7 text-sm font-medium text-[#5d6b82] md:flex">
                <a href="/features" className="transition hover:text-[#0047AB]">Features</a>
                <a href="/app" className="transition hover:text-[#0047AB]">App</a>
                <a href="/stats" className="transition hover:text-[#0047AB]">Stats</a>
                <a href="/testimonials" className="transition hover:text-[#0047AB]">Testimonials</a>
              </div>
              <div className="flex items-center gap-3">
                <a href="/patient-login" className="rounded-full bg-[#6f4cf5] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#5c3fe0] text-sm font-semibold hidden md:inline-flex">
                  For Patients
                </a>
                <a href="/hms/login" className="rounded-full bg-white px-5 py-2.5 text-[#0c1b2a] shadow-sm text-sm font-semibold hidden md:inline-flex border border-[#0047AB]/15">
                  HMS
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-14">
        <span className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#0047AB]">
          <span className="h-[2px] w-9 rounded-full bg-[#B2AC88]" />
          The Medical Brains
        </span>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-[#0c1b2a] md:text-5xl">
          Meet the team that makes the magic happen
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5d6b82]">
          A high-trust panel of integrative Ayurvedic leaders guiding CliniLocker’s patient-first
          roadmap with science-backed, compassionate care.
        </p>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {advisors.map((advisor) => (
            <article
              key={advisor.name}
              className="flex flex-col gap-4 rounded-[28px] border border-[#0047AB]/10 bg-white p-6 shadow-[0_16px_32px_rgba(12,27,42,0.08)]"
            >
              <div className="flex h-24 w-full items-center justify-center rounded-[22px] border border-[#0047AB]/10 bg-[#f9fafc]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#0047AB]/20 bg-white text-xs font-semibold text-[#0047AB]">
                  {advisor.initials}
                </div>
              </div>
              <div className="rounded-2xl border border-[#0047AB]/10 bg-white px-4 py-3">
                <h3 className="text-base font-semibold text-[#0c1b2a]">{advisor.name}</h3>
                <p className="text-xs font-medium text-[#5d6b82]">{advisor.degree}</p>
              </div>
              <p className="text-sm font-semibold text-[#B2AC88]">{advisor.role}</p>
              <div className="mt-auto rounded-2xl bg-[#0047AB]/5 px-4 py-3 text-xs font-semibold text-[#0047AB]">
                {advisor.focus}
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MedicalBrains;
