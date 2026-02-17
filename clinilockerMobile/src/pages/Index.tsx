import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Shield, Lock, Smartphone, Cloud, ArrowRight, X, Heart, Users } from "lucide-react";

const onboardingSlides = [
  {
    icon: Heart,
    title: "Trusted care tailored for your loved ones",
    description: "We believe every family deserves care that is both personal and reliable.",
    gradient: "from-blue-500 to-cyan-500",
    imageBg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "Your family's well-being, our top priority",
    description: "We understand that nothing matters more than the health and comfort of your loved ones.",
    gradient: "from-purple-500 to-pink-500",
    imageBg: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Secure Health Reports",
    description: "Your medical reports are encrypted and stored safely. Access them anytime, anywhere.",
    gradient: "from-green-500 to-emerald-500",
    imageBg: "bg-green-50",
  },
  {
    icon: Smartphone,
    title: "Access on Mobile",
    description: "View and share your reports instantly on your phone. No need to carry physical copies.",
    gradient: "from-orange-500 to-red-500",
    imageBg: "bg-orange-50",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  // If authenticated user lands on home page (e.g., after OAuth redirects to /#), redirect to dashboard
  useEffect(() => {
    if (loading || location.pathname !== "/" || !user) return;
    
    // Wait for role to be determined, then redirect
    if (role === "lab") {
      navigate("/lab/dashboard", { replace: true });
    } else if (role === null) {
      // Role not determined yet, default to patient dashboard
      const timer = setTimeout(() => {
        navigate("/patient/dashboard", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      navigate("/patient/dashboard", { replace: true });
    }
  }, [user, role, loading, navigate, location.pathname]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleSkip = () => {
    navigate("/patient-login");
  };

  const handleGetStarted = () => {
    navigate("/patient-login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Skip Button */}
      <div className="absolute right-4 top-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground h-9 w-9 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-md">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: false,
              skipSnaps: false,
              duration: 25,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {onboardingSlides.map((slide, index) => {
                const Icon = slide.icon;
                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-full">
                    {/* Card Container with Shadow - Matching Reference */}
                    <div className="rounded-3xl border border-border/50 bg-card shadow-xl p-6 sm:p-8 mx-auto max-w-sm">
                      <div className="flex flex-col items-center justify-center text-center space-y-6">
                        {/* Image/Icon - Smaller and Cleaner */}
                        <div className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full ${slide.imageBg} flex items-center justify-center shadow-lg`}>
                          <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center`}>
                            <Icon className="h-14 w-14 sm:h-16 sm:w-16 text-white" />
                          </div>
                        </div>

                        {/* Content - Matching Reference Style */}
                        <div className="space-y-3">
                          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight px-2">
                            {slide.title}
                          </h2>
                          <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto leading-relaxed px-2">
                            {slide.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {/* Navigation Dots - Matching Reference */}
          <div className="flex justify-center gap-2 mt-6 sm:mt-8">
            {onboardingSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  current === index ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions - Matching Reference */}
      <div className="px-4 sm:px-6 pb-6 sm:pb-8 space-y-3">
        {current === onboardingSlides.length - 1 ? (
          <Button
            size="lg"
            className="w-full min-h-[52px] text-base sm:text-lg rounded-full"
            onClick={handleGetStarted}
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full min-h-[52px] text-base sm:text-lg rounded-full"
            onClick={() => api?.scrollNext()}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Login Link */}
        <div className="text-center">
          <Button variant="link" className="text-sm sm:text-base text-muted-foreground" asChild>
            <Link to="/patient-login">Already have an account? Log in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
