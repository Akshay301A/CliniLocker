import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import heroHealth from "@/assets/landing/hero-health.jpg";

const HealthRecordLockerGuide = () => {
  useEffect(() => {
    document.title = "What is a Health Record Locker? 2026 Guide | CliniLocker";
  }, []);

  return (
    <div className="landing-theme min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">Definition Guide</span>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
                What is a Health Record Locker? The 2026 Guide to Digital Health in India
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                A simple, accurate definition of health record lockers in the ABDM ecosystem — covering ABHA ID,
                Personal Health Records (PHR), consent-based sharing, and how encryption keeps your data safe.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="rounded-3xl border border-border/60 bg-white/80 shadow-[0_18px_50px_rgba(16,24,40,0.08)] overflow-hidden">
              <img
                src={heroHealth}
                alt="Digital health records"
                className="h-56 sm:h-72 w-full object-cover"
              />
              <div className="p-6 sm:p-10 space-y-6 text-muted-foreground">
                <p className="text-base sm:text-lg">
                  A health record locker is a secure digital place where an individual stores and manages their
                  medical records. In India, this concept aligns with the Ayushman Bharat Digital Mission (ABDM),
                  which enables citizens to organize their health data and share it with hospitals, labs, or
                  doctors through consent.
                </p>

                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">ABHA ID: your digital health identity</h2>
                  <p>
                    The ABHA (Ayushman Bharat Health Account) ID is the unique identifier used in ABDM. It links
                    your medical data across providers while keeping you in control. Think of it as your
                    identity layer for health records in India.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">PHR: your Personal Health Record</h2>
                  <p>
                    A PHR (Personal Health Record) is the actual collection of your medical documents — lab
                    reports, prescriptions, imaging, and visit notes. A health record locker organizes these files
                    so you can access them anytime and share them with the right people.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Consent-based sharing</h2>
                  <p>
                    ABDM is built around consent. You choose when, how, and with whom your records are shared. A
                    health record locker makes this simple by letting you generate secure access links or
                    time-limited permissions.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">How encryption protects your data</h2>
                  <p>
                    Health record lockers use encryption to protect your information both in transit and at rest.
                    This means your data is scrambled when it moves across the internet and stays protected when
                    stored. Access controls and audit trails add an extra layer of safety.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white/70 p-5 text-sm">
                  <p className="text-foreground font-semibold">Quick summary</p>
                  <ul className="mt-2 list-disc pl-5 space-y-2">
                    <li>ABHA ID is your digital health identity in the ABDM ecosystem.</li>
                    <li>PHR is your personal health record (reports, prescriptions, imaging).</li>
                    <li>Health record lockers enable consent-based sharing with doctors and labs.</li>
                    <li>Encryption and access controls protect your data end-to-end.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Link to="/blogs" className="text-sm font-semibold text-primary hover:text-primary/80">
                    Back to all blogs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HealthRecordLockerGuide;
