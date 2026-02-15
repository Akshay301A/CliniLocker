import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PricingPage = () => (
  <PublicLayout>
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">Pricing</h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground">
            Start free. Scale as your lab grows.
          </p>
        </div>
        <div className="mx-auto mt-8 sm:mt-12 md:mt-16 grid max-w-3xl gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8 shadow-card">
            <h3 className="font-display text-2xl font-bold text-foreground">Free</h3>
            <p className="mt-1 text-muted-foreground">Perfect for small labs</p>
            <div className="my-8">
              <span className="font-display text-5xl font-extrabold text-foreground">₹0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Up to 200 reports/month</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Secure patient links</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Basic dashboard</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Email support</li>
            </ul>
            <Button variant="outline" className="mt-8 w-full" asChild>
              <Link to="/signup">Start Free</Link>
            </Button>
          </div>
          <div className="relative rounded-xl border-2 border-primary bg-card p-5 sm:p-6 md:p-8 shadow-elevated">
            <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
              Popular
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Pro</h3>
            <p className="mt-1 text-muted-foreground">For growing labs &amp; clinics</p>
            <div className="my-8">
              <span className="font-display text-5xl font-extrabold text-foreground">₹999</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Unlimited reports</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> WhatsApp &amp; SMS delivery</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Priority support</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Advanced analytics</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Custom branding</li>
            </ul>
            <Button className="mt-8 w-full" asChild>
              <Link to="/signup">Get Pro</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default PricingPage;
