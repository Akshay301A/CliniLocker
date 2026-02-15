import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";

const TermsOfService = () => (
  <PublicLayout>
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container px-4 max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <img src="/favicon.png" alt="" className="h-4 w-4 object-contain" /> Back to CliniLocker
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-8 sm:mt-10 prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base text-muted-foreground space-y-6">
          <p>
            Welcome to CliniLocker. By using our website and services (“Service”), you agree to these Terms of Service
            (“Terms”). Please read them carefully. CliniLocker is operated by RNJ PVT LTD (“we”, “us”, “our”).
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CliniLocker, you agree to be bound by these Terms and our Privacy Policy. If you do
            not agree, do not use the Service.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">2. Description of Service</h2>
          <p>
            CliniLocker provides a platform for diagnostic labs to upload, store, and share health reports with
            patients. Patients can view, download, and manage their reports. The Service is not a substitute for
            professional medical advice; report content is for informational purposes only.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">3. Accounts and Eligibility</h2>
          <p>
            You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Service. You are
            responsible for keeping your account credentials secure and for all activity under your account. You must
            provide accurate information when registering.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">4. Acceptable Use</h2>
          <p>
            You agree not to use the Service for any unlawful purpose, to upload false or misleading health data, to
            impersonate others, or to attempt to gain unauthorized access to our systems or other users’ data. We may
            suspend or terminate accounts that violate these Terms.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">5. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. We process health data in accordance with
            applicable law and our Privacy Policy. By using the Service, you consent to such processing.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">6. Intellectual Property</h2>
          <p>
            CliniLocker, including its name, logo, and the software powering the Service, is owned by RNJ PVT LTD. You
            may not copy, modify, or distribute our materials without our written permission. Report content uploaded by
            labs or patients remains the responsibility of the uploader; we do not claim ownership of that content.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">7. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED “AS IS”. WE DO NOT GUARANTEE UNINTERRUPTED OR ERROR-FREE ACCESS. WE ARE NOT
            RESPONSIBLE FOR THE ACCURACY OF REPORT CONTENT UPLOADED BY LABS OR USERS. THE SERVICE DOES NOT PROVIDE
            MEDICAL ADVICE; CONSULT A HEALTHCARE PROVIDER FOR MEDICAL DECISIONS.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, RNJ PVT LTD AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">9. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will post the revised Terms on this page and update the
            “Last updated” date. Continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">10. Contact</h2>
          <p>
            For questions about these Terms, contact us at support@clinilocker.com or at the contact details provided
            on our website. CliniLocker is operated by RNJ PVT LTD.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <Link to="/" className="text-primary font-medium hover:underline">Back to Home</Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link to="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default TermsOfService;
