import { PublicLayout } from "@/components/PublicLayout";
import { Shield, Heart, Users } from "lucide-react";

const AboutPage = () => (
  <PublicLayout>
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">About CliniLocker</h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground px-2">
            We're building the simplest way for labs to share reports and for patients to access them securely.
          </p>
        </div>
        <div className="mx-auto mt-8 sm:mt-12 md:mt-16 grid max-w-4xl gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Security First</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every report is encrypted and access-controlled. Patient data privacy is our top priority.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Patient-Centric</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Designed for patients who want easy, instant access to their health reports.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Lab Friendly</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Simple tools that fit into existing lab workflows. No training needed.
            </p>
          </div>
        </div>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Developed by CliniLocker developers. From RNJ PVT LTD.
        </p>
      </div>
    </section>
  </PublicLayout>
);

export default AboutPage;
