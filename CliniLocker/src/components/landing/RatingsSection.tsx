import { motion, AnimatePresence, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, HeartHandshake, MessageSquareHeart, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getPublicAppConfigValue, submitUserRating } from "@/lib/api";

const GOOGLE_REVIEW_FALLBACK_URL = "https://g.page/r/CV16WDYMeDMsEAE/review";
const RATING_CREATED_EVENT = "clinilocker-rating-created";

const ratingMood = [
  {
    stars: 1,
    emoji: "😞",
    title: "This didn’t feel right",
    helper: "Tell us what went wrong and we’ll use it to improve CliniLocker quickly.",
  },
  {
    stars: 2,
    emoji: "😕",
    title: "There’s room to improve",
    helper: "A quick note from you will help us smooth out the rough edges.",
  },
  {
    stars: 3,
    emoji: "🙂",
    title: "A decent start",
    helper: "Share what felt missing so we can make the experience stronger.",
  },
  {
    stars: 4,
    emoji: "😊",
    title: "That’s encouraging",
    helper: "If CliniLocker helped you, a Google review would really help others trust us too.",
  },
  {
    stars: 5,
    emoji: "🤩",
    title: "You made our day",
    helper: "We’d love for you to share this happiness on Google and help more people discover CliniLocker.",
  },
];

function getSentiment(stars: number): "negative" | "neutral" | "positive" {
  if (stars <= 2) return "negative";
  if (stars === 3) return "neutral";
  return "positive";
}

const RatingsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(GOOGLE_REVIEW_FALLBACK_URL);
  const [submitting, setSubmitting] = useState(false);
  const [submittedStars, setSubmittedStars] = useState<number | null>(null);

  useEffect(() => {
    getPublicAppConfigValue("google_business_review_url").then((value) => {
      if (value) setGoogleReviewUrl(value);
    });
  }, []);

  const activeStars = hoverStars || selectedStars;
  const selectedMood = useMemo(
    () => ratingMood.find((entry) => entry.stars === selectedStars) ?? null,
    [selectedStars]
  );
  const showCommentPrompt = selectedStars > 0 && selectedStars <= 3;
  const showGooglePrompt = selectedStars >= 4;

  const resetForm = () => {
    setSelectedStars(0);
    setHoverStars(0);
    setComment("");
    setContactName("");
    setContactEmail("");
  };

  const handleSubmit = async () => {
    if (!selectedStars) {
      toast.error("Please choose a rating first.");
      return;
    }

    if (selectedStars <= 3 && comment.trim().length < 8) {
      toast.error("Please tell us a little more so we can improve this experience.");
      return;
    }

    setSubmitting(true);
    const mood = ratingMood.find((entry) => entry.stars === selectedStars);
    const result = await submitUserRating({
      stars: selectedStars,
      emoji: mood?.emoji ?? "🙂",
      sentiment: getSentiment(selectedStars),
      comment,
      contactName,
      contactEmail,
      source: "website",
      pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
      googleReviewPrompted: selectedStars >= 4 && Boolean(googleReviewUrl),
    });
    setSubmitting(false);

    if (result.error) {
      toast.error("We couldn't save your rating right now. Please try again once.");
      return;
    }

    setSubmittedStars(selectedStars);
    if (selectedStars >= 4 && comment.trim().length >= 12 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(RATING_CREATED_EVENT, {
          detail: {
            id: crypto.randomUUID(),
            stars: selectedStars,
            emoji: mood?.emoji ?? "🙂",
            comment: comment.trim(),
            contact_name: contactName.trim() || "CliniLocker user",
            created_at: new Date().toISOString(),
          },
        })
      );
    }
    toast.success(selectedStars >= 4 ? "Thanks for the love." : "Thanks for the honest feedback.");
    resetForm();
  };

  const submittedMood = submittedStars
    ? ratingMood.find((entry) => entry.stars === submittedStars) ?? null
    : null;

  return (
    <section id="ratings" className="py-16 sm:py-20 lg:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-sky-100/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-sky-100 bg-white shadow-[0_30px_90px_rgba(38,99,235,0.10)]"
        >
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] p-8 sm:p-10 lg:p-12">
              <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-200/50 blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  User Ratings
                </div>

                <h2 className="mt-6 max-w-lg text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  How does CliniLocker feel in real use?
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Rate your experience, drop a quick note, and help us shape a calmer, faster health-record experience for everyone.
                </p>

                <div className="mt-10 rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_45px_rgba(59,130,246,0.10)] backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Live reaction</p>
                      <p className="mt-2 text-xl font-bold text-slate-950">
                        {selectedMood?.title || "Pick your stars"}
                      </p>
                    </div>
                    <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#ffffff_0%,#e8f3ff_100%)] text-4xl shadow-inner">
                      {selectedMood?.emoji || "💙"}
                    </div>
                  </div>
                  <p className="mt-4 min-h-[56px] text-sm leading-6 text-slate-600 sm:text-base">
                    {selectedMood?.helper || "Choose a rating and we’ll tailor the next step, with a matching emoji reaction too."}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                      <div className="flex items-center gap-3 text-blue-800">
                        <HeartHandshake className="h-5 w-5" />
                        <p className="font-semibold">Happy users can boost Google trust</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-blue-900/80">
                        Ratings of 4 or 5 stars can be guided to your Google Business Profile review link.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3 text-slate-700">
                        <MessageSquareHeart className="h-5 w-5" />
                        <p className="font-semibold">Direct feedback goes to the CliniLocker team</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Share suggestions and real experience notes directly with us so we can keep improving the product quickly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Rate CliniLocker</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                    Tap the stars, feel the emoji, and tell us the truth
                  </h3>
                </div>
                <div className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                  Website feedback flow
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-wrap gap-3">
                  {ratingMood.map((entry) => {
                    const active = activeStars >= entry.stars;
                    return (
                      <button
                        key={entry.stars}
                        type="button"
                        onMouseEnter={() => setHoverStars(entry.stars)}
                        onMouseLeave={() => setHoverStars(0)}
                        onFocus={() => setHoverStars(entry.stars)}
                        onBlur={() => setHoverStars(0)}
                        onClick={() => {
                          setSelectedStars(entry.stars);
                          setSubmittedStars(null);
                        }}
                        className={cn(
                          "group flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200",
                          active
                            ? "border-blue-500 bg-blue-600 text-white shadow-[0_16px_30px_rgba(37,99,235,0.25)]"
                            : "border-slate-200 bg-white text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        )}
                        aria-label={`Rate ${entry.stars} star${entry.stars > 1 ? "s" : ""}`}
                      >
                        <Star className={cn("h-6 w-6", active && "fill-current")} />
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {selectedMood ? (
                    <motion.div
                      key={selectedMood.stars}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6 rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                            {selectedMood.stars} star{selectedMood.stars > 1 ? "s" : ""}
                          </p>
                          <h4 className="mt-2 text-2xl font-bold text-slate-950">{selectedMood.title}</h4>
                          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                            {selectedMood.helper}
                          </p>
                        </div>
                        <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-blue-50 text-5xl shadow-inner">
                          {selectedMood.emoji}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="mt-8 grid gap-4">
                <Input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Your name (optional)"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                />
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="Email for follow-up (optional)"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                />
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={
                    showCommentPrompt
                      ? "What felt broken, confusing, or missing?"
                      : "Optional: tell us what you loved or what would make CliniLocker even better."
                  }
                  className="min-h-[150px] rounded-[24px] border-slate-200 bg-slate-50/70 px-4 py-3"
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="h-12 rounded-full bg-blue-600 px-7 text-base font-semibold hover:bg-blue-700"
                >
                  {submitting ? "Saving your rating..." : "Submit Rating"}
                </Button>
                {showGooglePrompt && googleReviewUrl ? (
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-6 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    Leave a Google Review
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-sm leading-6 text-slate-500">
                {showCommentPrompt ? (
                  <p>For ratings under 4 stars, your note helps us fix real product issues faster.</p>
                ) : null}
                {showGooglePrompt ? (
                  <p>
                    Google ratings only update when users submit their review on your Google Business Profile review page.
                  </p>
                ) : null}
              </div>

              {submittedMood ? (
                <div className="mt-8 rounded-[28px] border border-emerald-200 bg-emerald-50/80 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                      {submittedMood.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Saved</p>
                      <h4 className="mt-1 text-xl font-bold text-slate-950">
                        Thanks for rating CliniLocker {submittedMood.stars} star{submittedMood.stars > 1 ? "s" : ""}.
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {submittedMood.stars >= 4
                          ? "Your positive feedback is saved. If the Google review button is configured, you can also share this publicly."
                          : "Your private feedback is saved and can now guide product improvements."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RatingsSection;
