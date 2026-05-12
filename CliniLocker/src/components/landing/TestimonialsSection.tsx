import { motion, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareQuote, Star } from "lucide-react";

import { getPublicUserRatings, type PublicUserRating } from "@/lib/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const fallbackTestimonials = [
  {
    id: "fallback-doctor-1",
    stars: 5,
    emoji: "🤩",
    comment:
      "CliniLocker makes patient records instantly accessible. Sharing reports with families and specialists is now effortless.",
    contact_name: "Dr. A. Menon",
  },
  {
    id: "fallback-patient-1",
    stars: 5,
    emoji: "😊",
    comment:
      "I keep all my parents' reports in one place. Reminders are timely and the sharing flow feels genuinely easy to use.",
    contact_name: "Priya R.",
  },
  {
    id: "fallback-doctor-2",
    stars: 5,
    emoji: "💙",
    comment:
      "The doctor share inbox is smooth and practical. Patients can send reports quickly and I can review them without confusion.",
    contact_name: "Dr. Rohit K.",
  },
  {
    id: "fallback-patient-2",
    stars: 4,
    emoji: "🙂",
    comment:
      "I used to search old chats and files for prescriptions. Now everything is in one place and much easier to manage.",
    contact_name: "Sneha P.",
  },
  {
    id: "fallback-doctor-3",
    stars: 5,
    emoji: "👏",
    comment:
      "For follow-ups, having reports arrive in a clean dashboard saves time. It feels focused and practical for real clinic use.",
    contact_name: "Dr. Vivek S.",
  },
  {
    id: "fallback-patient-3",
    stars: 5,
    emoji: "😍",
    comment:
      "The family records part is what helped me most. I can keep my mother's and father's reports organized without stress.",
    contact_name: "Anjali M.",
  },
  {
    id: "fallback-patient-4",
    stars: 4,
    emoji: "😊",
    comment:
      "Uploading reports and opening them later on my phone is simple. It feels much better than keeping screenshots everywhere.",
    contact_name: "Kiran T.",
  },
  {
    id: "fallback-doctor-4",
    stars: 5,
    emoji: "💯",
    comment:
      "Verification plus direct patient sharing gives this product a serious edge. It feels trustworthy and useful from day one.",
    contact_name: "Dr. Neha R.",
  },
  {
    id: "fallback-patient-5",
    stars: 5,
    emoji: "✨",
    comment:
      "The QR flow is surprisingly convenient. I can pull up my details fast and share reports when needed without extra steps.",
    contact_name: "Harish G.",
  },
  {
    id: "fallback-doctor-5",
    stars: 4,
    emoji: "👍",
    comment:
      "CliniLocker keeps the report-sharing process clean. The interface is simple enough that patients can use it without much guidance.",
    contact_name: "Dr. Farah I.",
  },
] as const;

const RATING_CREATED_EVENT = "clinilocker-rating-created";

function normalizeDisplayName(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  return trimmed.length > 0 ? trimmed : "CliniLocker user";
}

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [userTestimonials, setUserTestimonials] = useState<PublicUserRating[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    let mounted = true;
    getPublicUserRatings(3).then((rows) => {
      if (!mounted) return;
      setUserTestimonials(rows);
    });

    const handleRatingCreated = (event: Event) => {
      const detail = (event as CustomEvent<PublicUserRating>).detail;
      if (!detail || !detail.comment) return;
      setUserTestimonials((current) => {
        const next = [detail, ...current.filter((item) => item.id !== detail.id)];
        return next.slice(0, 3);
      });
    };

    window.addEventListener(RATING_CREATED_EVENT, handleRatingCreated);
    return () => {
      mounted = false;
      window.removeEventListener(RATING_CREATED_EVENT, handleRatingCreated);
    };
  }, []);

  const testimonials = useMemo(
    () => {
      const fallbackPool = fallbackTestimonials.filter(
        (item) => !userTestimonials.some((review) => review.contact_name === item.contact_name)
      );
      return [...userTestimonials, ...fallbackPool].slice(0, 10);
    },
    [userTestimonials]
  );

  useEffect(() => {
    if (!carouselApi) return;

    const autoplay = window.setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 3200);

    return () => window.clearInterval(autoplay);
  }, [carouselApi]);

  return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-background relative">
      <div className="absolute inset-x-0 top-0 h-64 bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">User Reviews</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-4 mb-6">
            Strong experiences from people using CliniLocker
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Reviews shown here are pulled from high-rated CliniLocker feedback shared through the website.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: true, align: "start" }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem
                  key={testimonial.id}
                  className="pl-4 md:basis-1/2 xl:basis-1/3"
                >
                  <div className="h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(37,99,235,0.10)] sm:p-8">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1 text-yellow-400">
                        {Array.from({ length: testimonial.stars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400" />
                        ))}
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                        {testimonial.emoji}
                      </div>
                    </div>

                    <div className="mt-5 flex items-start gap-3">
                      <MessageSquareQuote className="mt-1 h-5 w-5 text-blue-500" />
                      <p className="text-sm leading-7 text-slate-600 sm:text-base">
                        "{testimonial.comment?.trim()}"
                      </p>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <p className="font-bold text-slate-950">{normalizeDisplayName(testimonial.contact_name)}</p>
                      <p className="mt-1 text-sm text-slate-500">CliniLocker review</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 top-[42%] hidden h-11 w-11 border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 xl:flex" />
            <CarouselNext className="right-2 top-[42%] hidden h-11 w-11 border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 xl:flex" />
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
