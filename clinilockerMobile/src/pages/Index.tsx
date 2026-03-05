import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ArrowLeft, BellRing, FileText, HeartPulse, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { AppFooter } from "@/components/AppFooter";

type CarouselApi = UseEmblaCarouselType[1];

type Slide = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "sky" | "emerald" | "rose" | "violet";
};

const onboardingSlides: Slide[] = [
  {
    title: "Secure Health Vault",
    description: "Your reports stay encrypted and protected. Access them anytime with confidence.",
    icon: ShieldCheck,
    accent: "sky",
  },
  {
    title: "Family Care Sharing",
    description: "Share selected reports with family members so everyone stays informed and supported.",
    icon: Users,
    accent: "emerald",
  },
  {
    title: "All Reports Together",
    description: "Keep lab reports, prescriptions, and follow-up files organized in one place.",
    icon: FileText,
    accent: "violet",
  },
  {
    title: "Smart Health Alerts",
    description: "Get timely reminders and updates when new reports are ready for review.",
    icon: BellRing,
    accent: "rose",
  },
];

const accentMap = {
  sky: {
    icon: "bg-sky-100 text-sky-700",
    button: "from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700",
    dot: "bg-sky-500",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    button: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
    dot: "bg-emerald-500",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700",
    button: "from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700",
    dot: "bg-violet-500",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700",
    button: "from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600",
    dot: "bg-rose-500",
  },
};

const Index = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<CarouselApi | undefined>();

  const handleSkip = () => navigate("/patient-login");
  const handleGetStarted = () => navigate("/patient-login");

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      api?.scrollNext();
      return;
    }
    handleGetStarted();
  };

  const current = onboardingSlides[currentSlide];
  const tone = accentMap[current.accent];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-sky-50/20 to-white relative overflow-hidden">
      <div className="absolute -top-24 -left-16 h-52 w-52 rounded-full bg-sky-300/12" />
      <div className="absolute top-1/2 -right-20 h-56 w-56 rounded-full bg-emerald-300/12" />
      <div className="absolute bottom-20 left-10 h-36 w-36 rounded-full bg-violet-300/12" />

      <div className="px-4 pt-4 pb-2 relative z-10 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <img src="/logo%20(2).png" alt="CliniLocker" className="h-16 w-auto object-contain" />
        <button
          onClick={handleSkip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-background/60 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 px-4 py-4 relative z-10 flex items-center">
        <Carousel
          className="w-full max-w-md mx-auto"
          opts={{ align: "start", loop: false }}
          setApi={(carouselApi) => {
            setApi(carouselApi);
            if (!carouselApi) return;
            carouselApi.on("select", () => setCurrentSlide(carouselApi.selectedScrollSnap()));
          }}
        >
          <CarouselContent>
            {onboardingSlides.map((slide, idx) => {
              const t = accentMap[slide.accent];
              const Icon = slide.icon;
              return (
                <CarouselItem key={idx} className="basis-full">
                  <div className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm p-6 min-h-[390px] flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CliniLocker Care</span>
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                    </div>

                    <div className={`mt-8 h-20 w-20 rounded-2xl ${t.icon} flex items-center justify-center`}>
                      <Icon className="h-10 w-10" />
                    </div>

                    <h2 className="mt-8 text-2xl font-bold text-slate-900 leading-tight">{slide.title}</h2>
                    <p className="mt-3 text-base text-slate-600 leading-relaxed">{slide.description}</p>

                    <div className="mt-auto pt-8">
                      <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-sm text-slate-600">
                        Built for patients and families who want health records to be easy, safe, and always available.
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="flex justify-center gap-2.5 mb-5 relative z-10">
        {onboardingSlides.map((slide, index) => (
          <button
            key={slide.title}
            onClick={() => api?.scrollTo(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? `${accentMap[slide.accent].dot} w-8` : "w-2.5 bg-slate-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="px-6 pb-7 relative z-10">
        <Button
          onClick={handleNext}
          className={`w-full h-13 text-base font-semibold rounded-2xl text-white bg-gradient-to-r ${tone.button} shadow-lg`}
        >
          {currentSlide === onboardingSlides.length - 1 ? "Get Started" : "Continue"}
        </Button>
      </div>

      <AppFooter />
    </div>
  );
};

export default Index;
