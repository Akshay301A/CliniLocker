import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ArrowLeft } from "lucide-react";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { AppFooter } from "@/components/AppFooter";

type CarouselApi = UseEmblaCarouselType[1];

const onboardingSlides = [
  {
    title: "Secure Health Records",
    description: "Your medical reports are encrypted and stored safely. Access them anytime, anywhere.",
    buttonColor: "bg-blue-500 hover:bg-blue-600",
    dotColor: "bg-blue-500",
    icon: "🛡️",
    bgGradient: "from-blue-100 to-cyan-50",
    iconBg: "bg-blue-100"
  },
  {
    title: "Share with Family",
    description: "Easily share your health reports with family members. Keep everyone informed.",
    buttonColor: "bg-orange-400 hover:bg-orange-500",
    dotColor: "bg-orange-400",
    icon: "👨‍👩‍👧‍👦",
    bgGradient: "from-orange-100 to-pink-50",
    iconBg: "bg-orange-100"
  },
  {
    title: "All Reports in One Place",
    description: "View all your lab reports, test results, and medical documents in one secure app.",
    buttonColor: "bg-purple-500 hover:bg-purple-600",
    dotColor: "bg-purple-500",
    icon: "📄",
    bgGradient: "from-purple-100 to-pink-50",
    iconBg: "bg-purple-100"
  },
  {
    title: "Lab Integration",
    description: "Get reports directly from your lab. Instant notifications when new reports are ready.",
    buttonColor: "bg-green-500 hover:bg-green-600",
    dotColor: "bg-green-500",
    icon: "🏥",
    bgGradient: "from-green-100 to-emerald-50",
    iconBg: "bg-green-100"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<CarouselApi | undefined>();

  const handleSkip = () => {
    navigate("/patient-login");
  };

  const handleGetStarted = () => {
    navigate("/patient-login");
  };

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      api?.scrollNext();
    } else {
      handleGetStarted();
    }
  };

  const handleDotClick = (index: number) => {
    api?.scrollTo(index);
  };

  const currentSlideData = onboardingSlides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f5] via-[#faf9f7] to-[#f5f7fa] flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        {/* Back Arrow */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 transition-colors p-2 -ml-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Logo Only - Bigger */}
        <div className="flex items-center justify-center flex-1">
          <img
            src="/logo%20(2).png"
            alt="CliniLocker"
            className="h-60 w-auto object-contain max-h-[120px]"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-100/50"
        >
          Skip
        </button>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <Carousel
          className="w-full max-w-sm"
          opts={{
            align: "start",
            loop: false,
          }}
          setApi={(carouselApi) => {
            setApi(carouselApi);
            if (carouselApi) {
              carouselApi.on("select", () => {
                setCurrentSlide(carouselApi.selectedScrollSnap());
              });
            }
          }}
        >
          <CarouselContent>
            {onboardingSlides.map((slide, index) => (
              <CarouselItem key={index} className="basis-full">
                <div className="flex flex-col items-center justify-center px-4">
                  {/* Main Card Container - Cartoon Style */}
                  <div className={`w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 flex flex-col items-center relative overflow-hidden border-2 border-white/50`}>
                    {/* Decorative gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} opacity-30`}></div>
                    
                    {/* Icon/Illustration - Large and Cartoon Style */}
                    <div className="mb-8 flex items-center justify-center relative z-10">
                      <div className={`${slide.iconBg} p-8 rounded-3xl shadow-lg transform hover:scale-105 transition-transform duration-300`}>
                        <div className="text-7xl md:text-8xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
                          {slide.icon}
                        </div>
                      </div>
                    </div>

                    {/* Title - Bold and Playful */}
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4 leading-tight relative z-10">
                      {slide.title}
                    </h2>

                    {/* Description - Friendly Typography */}
                    <p className="text-base md:text-lg text-gray-600 text-center leading-relaxed max-w-sm relative z-10">
                      {slide.description}
                    </p>

                    {/* Decorative corner elements */}
                    <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-xl"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-tr from-white/40 to-transparent rounded-full blur-lg"></div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Pagination Dots - Cartoon Style */}
      <div className="flex justify-center gap-3 mb-6 relative z-10">
        {onboardingSlides.map((slide, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-3 rounded-full transition-all duration-300 shadow-md ${
              index === currentSlide
                ? `${slide.dotColor} w-10 shadow-lg scale-110`
                : "w-3 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Action Button - Cartoon Style */}
      <div className="px-6 pb-8 relative z-10">
        <Button
          onClick={currentSlide === onboardingSlides.length - 1 ? handleGetStarted : handleNext}
          className={`w-full h-16 text-lg font-bold rounded-3xl text-white shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 ${currentSlideData.buttonColor}`}
        >
          {currentSlide === onboardingSlides.length - 1 ? "Get Started 🚀" : "Continue →"}
        </Button>
      </div>
      <AppFooter />
    </div>
  );
};

export default Index;
