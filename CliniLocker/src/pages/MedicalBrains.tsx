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
    <div className="min-h-screen bg-[#f7f3ed] text-[#0c1b2a]">
      <nav className="sticky top-0 z-20 border-b border-[#0047AB]/10 bg-[#f7f3ed]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 text-base font-semibold text-[#0047AB]">
            <span className="h-8 w-8 rounded-full border border-[#0047AB]/20 bg-white shadow-sm" />
            CliniLocker
          </a>
          <div className="hidden items-center gap-5 text-sm font-medium text-[#47566b] md:flex">
            <a href="/features" className="transition hover:text-[#0047AB]">Features</a>
            <a href="/patient/abha/activate" className="transition hover:text-[#0047AB]">ABHA Sync</a>
            <a href="/about" className="transition hover:text-[#0047AB]">About Us</a>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <a href="/patient-login" className="text-[#47566b] transition hover:text-[#0047AB]">Log in</a>
            <a
              href="/signup"
              className="rounded-full bg-[#0047AB] px-5 py-2 text-white shadow-sm transition hover:bg-[#003c92]"
            >
              Get started
            </a>
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
    </div>
  );
};

export default MedicalBrains;
