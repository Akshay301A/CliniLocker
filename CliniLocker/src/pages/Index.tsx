import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AppDownloadSection from "@/components/landing/AppDownloadSection";
import StatsSection from "@/components/landing/StatsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="landing-theme min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <section className="py-4 sm:py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <h2 className="sr-only">Medical Records App India</h2>
            <p>
              CliniLocker is a medical records app in India that helps you store medical reports online safely.
              Keep lab reports and prescriptions organized, access health history anytime, and share reports
              securely with doctors or family when needed.
            </p>
            <p className="mt-2">
              Looking for the best way to manage health records digitally? Use CliniLocker to save lab reports,
              manage family medical records, and access medical history in emergencies.
            </p>
          </div>
        </div>
      </section>
      <FeaturesSection />
      <AppDownloadSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
