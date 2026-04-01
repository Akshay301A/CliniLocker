import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Utensils,
  Leaf,
  Sparkles,
  Wallet,
  Salad,
  Drumstick,
  Target,
  Loader2,
  Info,
} from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getReportById,
  getSignedUrl,
  getReportAI,
  saveDietPlan,
  generateDietPlanFromPdfUrl,
  type DietPlan,
  type DietPlanPrefs,
} from "@/lib/api";
import { Preloader } from "@/components/Preloader";

const defaultDietPrefs: DietPlanPrefs = {
  budget: "medium",
  dietType: "veg",
  goal: "general",
  customGoal: "",
};

function pathFromFileUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) {
    const match = fileUrl.match(/\/reports\/(.+)$/);
    return match ? match[1] : fileUrl;
  }
  return fileUrl;
}

const budgetOptions: Array<{ key: DietPlanPrefs["budget"]; label: string; icon: typeof Wallet }> = [
  { key: "low", label: "Budget", icon: Wallet },
  { key: "medium", label: "Balanced", icon: Wallet },
  { key: "high", label: "Premium", icon: Wallet },
];

const dietOptions: Array<{ key: DietPlanPrefs["dietType"]; label: string; icon: typeof Salad }> = [
  { key: "veg", label: "Vegetarian", icon: Salad },
  { key: "eggetarian", label: "Eggetarian", icon: Salad },
  { key: "non-veg", label: "Non‑veg", icon: Drumstick },
];

const goalOptions: Array<{ key: DietPlanPrefs["goal"]; label: string }> = [
  { key: "general", label: "General" },
  { key: "low-sugar", label: "Low Sugar" },
  { key: "low-cholesterol", label: "Low Cholesterol" },
  { key: "weight-loss", label: "Weight Loss" },
  { key: "kidney-care", label: "Kidney Care" },
  { key: "heart-health", label: "Heart Health" },
  { key: "custom", label: "Custom" },
];

const foodEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("rice") || n.includes("poha") || n.includes("idli")) return "🍚";
  if (n.includes("roti") || n.includes("chapati") || n.includes("bread")) return "🥖";
  if (n.includes("dal") || n.includes("lentil")) return "🥣";
  if (n.includes("salad") || n.includes("veg") || n.includes("vegetable")) return "🥗";
  if (n.includes("egg")) return "🥚";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("fish")) return "🐟";
  if (n.includes("fruit") || n.includes("banana") || n.includes("apple")) return "🍎";
  if (n.includes("milk") || n.includes("yogurt") || n.includes("curd")) return "🥛";
  if (n.includes("nuts") || n.includes("almond") || n.includes("walnut")) return "🥜";
  if (n.includes("oats")) return "🌾";
  return "🍽️";
};

const foodImageFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("rice") || n.includes("poha") || n.includes("idli")) return "https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=200&q=80";
  if (n.includes("roti") || n.includes("chapati") || n.includes("bread")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80";
  if (n.includes("dal") || n.includes("lentil")) return "https://images.unsplash.com/photo-1464306076886-da185f6a7805?auto=format&fit=crop&w=200&q=80";
  if (n.includes("salad") || n.includes("veg") || n.includes("vegetable")) return "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=200&q=80";
  if (n.includes("egg")) return "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=200&q=80";
  if (n.includes("chicken")) return "https://images.unsplash.com/photo-1604909053197-7820c0b1c6d0?auto=format&fit=crop&w=200&q=80";
  if (n.includes("fish")) return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80";
  if (n.includes("fruit") || n.includes("banana") || n.includes("apple")) return "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=200&q=80";
  if (n.includes("milk") || n.includes("yogurt") || n.includes("curd")) return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80";
  if (n.includes("nuts") || n.includes("almond") || n.includes("walnut")) return "https://images.unsplash.com/photo-1502741126161-b048400d5f7c?auto=format&fit=crop&w=200&q=80";
  if (n.includes("oats")) return "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=200&q=80";
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80";
};

const FoodThumb = ({ name, size = 44 }: { name: string; size?: number }) => {
  const [errored, setErrored] = useState(false);
  const src = foodImageFor(name);
  const emoji = foodEmoji(name);
  const dim = `${size}px`;
  if (errored) {
    return (
      <span
        className="flex items-center justify-center rounded-full bg-white shadow-sm text-lg"
        style={{ width: dim, height: dim }}
      >
        {emoji}
      </span>
    );
  }
  return (
    <span
      className="relative overflow-hidden rounded-full shadow-sm"
      style={{ width: dim, height: dim }}
    >
      <img
        src={src}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setErrored(true)}
      />
    </span>
  );
};

const DietPlanScreen = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [report, setReport] = useState<Awaited<ReturnType<typeof getReportById>>>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [dietPrefs, setDietPrefs] = useState<DietPlanPrefs>(defaultDietPrefs);
  const [customGoal, setCustomGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const r = await getReportById(id);
      if (!mounted) return;
      setReport(r);
      if (r?.file_url) {
        const path = pathFromFileUrl(r.file_url);
        if (path) {
          const url = await getSignedUrl(path);
          if (mounted) setPdfUrl(url ?? null);
        }
      }
      if (r?.id) {
        const stored = await getReportAI(r.id);
        if (stored?.diet_plan) setDietPlan(stored.diet_plan as DietPlan);
        if (stored?.diet_prefs) {
          const prefs = stored.diet_prefs as DietPlanPrefs;
          setDietPrefs(prefs);
          if (prefs.customGoal) setCustomGoal(prefs.customGoal);
        }
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const title = useMemo(() => report?.test_name ?? t("Diet Plan"), [report, t]);

  const handleGenerate = async () => {
    if (!pdfUrl || !id) return;
    setGenerating(true);
    setError(null);
    try {
      const payload: DietPlanPrefs = {
        ...dietPrefs,
        customGoal: dietPrefs.goal === "custom" ? customGoal.trim() : "",
      };
      const result = await generateDietPlanFromPdfUrl(pdfUrl, payload);
      if ("error" in result) {
        setError(result.error);
      } else {
        setDietPlan(result);
        await saveDietPlan(id, result, payload);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate diet plan.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !report) {
    return (
      <PatientLayout>
        <Preloader />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="min-h-screen bg-[#F7FBE9]">
        <div className="container mx-auto max-w-5xl px-4 pb-12 pt-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
              <Link to={`/patient/report/${id}`}>
                <ArrowLeft className="h-4 w-4" /> {t("Back to Report")}
              </Link>
            </Button>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
              <Utensils className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-foreground">{t("Diet Plan")}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-[#D9C4F6] p-6 text-foreground shadow-[0_20px_60px_rgba(137,87,255,0.18)]">
              <p className="text-xs uppercase tracking-widest text-foreground/70">{t("Find your plan")}</p>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-foreground/70">
                {t("Set your preferences and let AI craft a plan that matches your report values.")}
              </p>
              <Button className="mt-4 bg-[#1B1B1B] text-white hover:bg-black" onClick={handleGenerate} disabled={generating || !pdfUrl}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-2">{dietPlan ? t("Regenerate Plan") : t("Generate Plan")}</span>
              </Button>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-[0_18px_45px_rgba(16,24,40,0.12)]">
              <h3 className="text-sm font-semibold text-muted-foreground">{t("Preferences")}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Wallet className="h-4 w-4 text-emerald-500" /> {t("Budget")}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {budgetOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setDietPrefs((p) => ({ ...p, budget: opt.key }))}
                        className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                          dietPrefs.budget === opt.key ? "bg-[#1B1B1B] text-white" : "bg-[#F4F4F6] text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Leaf className="h-4 w-4 text-emerald-500" /> {t("Diet type")}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {dietOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setDietPrefs((p) => ({ ...p, dietType: opt.key }))}
                        className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                          dietPrefs.dietType === opt.key ? "bg-[#1B1B1B] text-white" : "bg-[#F4F4F6] text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Target className="h-4 w-4 text-emerald-500" /> {t("Goal")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {goalOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setDietPrefs((p) => ({ ...p, goal: opt.key }))}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          dietPrefs.goal === opt.key ? "bg-[#FF7A59] text-white" : "bg-[#F4F4F6] text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {dietPrefs.goal === "custom" && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        placeholder={t("Type your goal (e.g., PCOS support, muscle gain)")}
                        className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{t("Your Plan")}</h2>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                {dietPlan ? t("AI Generated") : t("Waiting")}
              </span>
            </div>

            {!dietPlan ? (
              <div className="rounded-3xl bg-white p-6 text-sm text-muted-foreground shadow-[0_14px_45px_rgba(16,24,40,0.1)]">
                {t("Generate a plan to see meals, portions, and why each item helps you.")}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {dietPlan.daily_plan.map((meal, idx) => (
                  <div key={`${meal.meal}-${idx}`} className="rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(16,24,40,0.12)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{meal.meal}</h3>
                      <span className="rounded-full bg-[#F4F4F6] px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {t("Meal")}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {meal.items.map((item, i) => (
                        <div key={`${item.name}-${i}`} className="rounded-2xl bg-[#F9FAFB] p-3">
                          <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                            <div className="flex items-center gap-3">
                              <FoodThumb name={item.name} size={48} />
                              <span>{item.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{item.portion}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {dietPlan && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(16,24,40,0.12)]">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("Foods to avoid")}</h3>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  {(dietPlan.foods_to_avoid ?? []).map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                      <FoodThumb name={item} size={36} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(16,24,40,0.12)]">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("Notes")}</h3>
                <ul className="mt-3 list-disc list-inside text-sm text-foreground space-y-1">
                  {(dietPlan.notes ?? []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3 rounded-2xl bg-white p-4 text-xs text-muted-foreground shadow-[0_8px_20px_rgba(16,24,40,0.08)]">
            <Info className="h-4 w-4 text-muted-foreground" />
            <p>
              {t("Diet guidance is AI-generated for general wellness. Always consult your doctor or dietitian for personalized advice.")}
            </p>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default DietPlanScreen;
