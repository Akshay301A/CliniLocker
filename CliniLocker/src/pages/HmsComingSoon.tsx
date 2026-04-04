import { ArrowRight, Building2, Mail } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const HmsComingSoon = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28">
        <section className="relative overflow-hidden">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-accent/10 blur-3xl rounded-full" />

          <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">CliniLocker HMS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground">
                HMS is coming soon
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                We are building a lightweight, modern hospital management system for clinics and small hospitals.
                Fast onboarding, paperless workflows, and secure access to patient records.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href="/signup"
                  className="glossy-btn text-primary-foreground px-6 sm:px-8 py-3.5 rounded-full font-semibold inline-flex items-center gap-2"
                >
                  Join early access
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="mailto:support@clinilocker.com"
                  className="glass-card px-6 sm:px-8 py-3.5 rounded-full font-semibold text-foreground inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HmsComingSoon;
