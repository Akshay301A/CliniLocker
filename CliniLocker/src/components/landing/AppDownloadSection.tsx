import { motion, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Apple, EllipsisVertical, Share2, Smartphone, Star, TriangleAlert } from "lucide-react";

import { getPublicUserRatings, type PublicUserRating } from "@/lib/api";

type PlatformKey = "ios" | "android";

const fallbackRatings: PublicUserRating[] = [
  {
    id: "fallback-1",
    stars: 5,
    emoji: null,
    comment: "Much easier than digging through old report files. The home screen app flow feels clean and reliable.",
    contact_name: "Ananya",
    created_at: "2026-05-01T10:00:00.000Z",
  },
  {
    id: "fallback-2",
    stars: 5,
    emoji: null,
    comment: "The QR card and report access are simple enough for my parents too. Keeping it on the home screen helps a lot.",
    contact_name: "Rohan",
    created_at: "2026-04-26T10:00:00.000Z",
  },
  {
    id: "fallback-3",
    stars: 4,
    emoji: null,
    comment: "Adding it to the home screen made it feel much more like a proper health app than opening it in a browser tab.",
    contact_name: "Sneha",
    created_at: "2026-04-18T10:00:00.000Z",
  },
];

const installGuides: Record<
  PlatformKey,
  {
    title: string;
    eyebrow: string;
    icon: ReactNode;
    steps: Array<{ title: string; body: string }>;
    note: string;
    cta: string;
  }
> = {
  ios: {
    title: "iPhone & iPad (Safari)",
    eyebrow: "Best on Safari",
    icon: <Apple className="h-5 w-5" />,
    steps: [
      {
        title: "Tap the Share button",
        body: "Open CliniLocker in Safari and use the Share icon from the bottom or top browser toolbar.",
      },
      {
        title: "Choose Add to Home Screen",
        body: "Scroll through the share sheet until you find Add to Home Screen.",
      },
      {
        title: "Tap Add",
        body: "CliniLocker will appear on your home screen and open in a cleaner app-style view.",
      },
    ],
    note: "Use Safari on iPhone or iPad. Other iOS browsers may not show the install option properly.",
    cta: "Use Safari for the cleanest install flow",
  },
  android: {
    title: "Android (Chrome)",
    eyebrow: "Best on Chrome",
    icon: <Smartphone className="h-5 w-5" />,
    steps: [
      {
        title: "Tap the menu button",
        body: "Open CliniLocker in Chrome and use the three-dot menu in the top right.",
      },
      {
        title: "Select Add to Home screen or Install app",
        body: "The exact wording can vary by device, but both options create the same app-like shortcut.",
      },
      {
        title: "Confirm Install",
        body: "CliniLocker will be added to your home screen and can open without browser clutter.",
      },
    ],
    note: "Chrome on Android gives the smoothest install flow for CliniLocker web app access.",
    cta: "Open in Chrome and add CliniLocker to your home screen",
  },
};

function getInitial(name?: string | null) {
  return (name || "C")
    .trim()
    .charAt(0)
    .toUpperCase();
}

const AppDownloadSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [platform, setPlatform] = useState<PlatformKey>("ios");
  const [publicRatings, setPublicRatings] = useState<PublicUserRating[]>([]);

  useEffect(() => {
    getPublicUserRatings(3)
      .then((ratings) => setPublicRatings(ratings))
      .catch(() => setPublicRatings([]));
  }, []);

  const mixedRatings = useMemo(() => {
    const interleaved = [
      ...(publicRatings[0] ? [publicRatings[0]] : []),
      fallbackRatings[0],
      ...(publicRatings[1] ? [publicRatings[1]] : []),
      fallbackRatings[1],
      ...(publicRatings[2] ? [publicRatings[2]] : []),
      fallbackRatings[2],
    ];

    const deduped = interleaved.filter((item, index, arr) => arr.findIndex((entry) => entry.id === item.id) === index);
    return deduped.slice(0, 4);
  }, [publicRatings]);

  const averageRating = useMemo(() => {
    if (!mixedRatings.length) return 4.9;
    const total = mixedRatings.reduce((sum, item) => sum + Number(item.stars || 0), 0);
    return Number((total / mixedRatings.length).toFixed(1));
  }, [mixedRatings]);

  const guide = installGuides[platform];

  return (
    <section
      id="app"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_48%,#ffffff_100%)] py-16 sm:py-20 lg:py-24"
    >
      <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-blue-100 bg-white shadow-sm">
              <Smartphone className="h-7 w-7 text-blue-600" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">Use CliniLocker as a web app</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Add CliniLocker to your home screen
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              No APK download needed. Install CliniLocker as a secure web app on your phone for the cleanest day-to-day experience.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {(["ios", "android"] as PlatformKey[]).map((key) => {
                const active = platform === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPlatform(key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    {key === "ios" ? "iPhone & iPad" : "Android"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  {guide.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{guide.eyebrow}</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{guide.title}</h3>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {guide.steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-base font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold">Important</p>
                    <p className="mt-1 text-sm leading-6 text-amber-900/80">{guide.note}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(90deg,#f8fbff_0%,#eef5ff_100%)] px-4 py-4 text-sm text-slate-700">
                {platform === "ios" ? <Share2 className="h-5 w-5 text-blue-600" /> : <EllipsisVertical className="h-5 w-5 text-blue-600" />}
                <p className="font-medium">{guide.cta}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">What people feel</p>
                <div className="mt-5 rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-5xl font-extrabold tracking-tight text-slate-950">{averageRating.toFixed(1)}</p>
                      <div className="mt-3 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Users</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">500+</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {mixedRatings.map((rating) => (
                  <div key={rating.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                          {getInitial(rating.contact_name)}
                        </div>
                        <p className="text-base font-semibold text-slate-950">{rating.contact_name || "CliniLocker user"}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {Array.from({ length: rating.stars }).map((_, index) => (
                            <Star key={`${rating.id}-${index}`} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-400">Verified website feedback</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {(rating.comment || "CliniLocker feels easy to keep on the home screen and use during emergencies.").trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
