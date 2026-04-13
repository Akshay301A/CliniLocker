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

const MedicalBrains = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="text-lg font-extrabold tracking-wide text-[#0047AB]">
            CliniLocker
          </a>
          <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-600">
            <a href="/features" className="transition hover:text-[#0047AB]">Features</a>
            <a href="/patient/abha/activate" className="transition hover:text-[#0047AB]">ABHA Sync</a>
            <a href="/about" className="transition hover:text-[#0047AB]">About Us</a>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-14">
        <span className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#0047AB]">
          <span className="h-[2px] w-9 rounded-full bg-[#B2AC88]" />
          The Medical Brains
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-slate-900 md:text-5xl">
          Clinical Advisory Board
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
          A high-trust panel of integrative Ayurvedic leaders guiding CliniLocker’s
          patient-first roadmap with science-backed, compassionate care.
        </p>

        <section className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {advisors.map((advisor) => (
            <article
              key={advisor.name}
              className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_14px_30px_rgba(10,23,49,0.08)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#0047AB]/15 bg-[radial-gradient(circle_at_30%_20%,#eef4ff,#d6e5ff_60%,#e7efe6_100%)] text-sm font-bold text-[#0047AB]">
                {advisor.initials}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{advisor.name}</h3>
                <p className="text-sm font-medium text-slate-500">{advisor.degree}</p>
              </div>
              <p className="text-sm font-semibold text-[#B2AC88]">{advisor.role}</p>
              <div className="mt-auto rounded-2xl bg-[#0047AB]/5 px-4 py-3 text-xs font-semibold text-[#0047AB]">
                {advisor.focus}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default MedicalBrains;
