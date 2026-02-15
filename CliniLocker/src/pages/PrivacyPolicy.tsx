import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => (
  <PublicLayout>
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container px-4 max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <Shield className="h-4 w-4" /> Back to CliniLocker
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-8 sm:mt-10 prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base text-muted-foreground space-y-6">
          <p>
            RNJ PVT LTD (“we”, “us”, “our”) operates CliniLocker. This Privacy Policy explains how we collect, use,
            store, and protect your information when you use our website and services (“Service”). We are committed to
            protecting your privacy and the confidentiality of health-related data.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">1. Information We Collect</h2>
          <p>
            We collect information you provide when you register (e.g. name, email, phone number), when labs upload
            reports (patient name, phone, report files), and when you use the Service (e.g. login history, preferences).
            We may also collect technical data such as IP address and device type for security and analytics.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
          <p>
            We use your information to provide and improve the Service, to link reports to patient accounts, to send
            you notifications (if you have opted in), to comply with legal obligations, and to protect the security and
            integrity of our systems. We do not sell your personal or health data to third parties.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">3. Storage and Security</h2>
          <p>
            Your data is stored on secure servers. We use encryption and access controls to protect report files and
            personal information. Access to health data is restricted to authorized users (e.g. the patient, linked
            labs) in accordance with our policies and applicable law.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">4. Sharing of Information</h2>
          <p>
            We may share information with service providers who assist us in operating the Service (e.g. hosting,
            analytics), subject to confidentiality obligations. We may disclose information when required by law or to
            protect our rights and safety. Report data may be shared with the lab that uploaded it and with the patient
            to whom it relates.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">5. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data,
            or to withdraw consent. You can update your profile and notification preferences in the app. For other
            requests, contact us at support@clinilocker.com.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">6. Cookies and Similar Technologies</h2>
          <p>
            We use cookies and similar technologies to maintain your session, remember preferences, and improve the
            Service. You can adjust your browser settings to limit cookies; some features may not work correctly if you
            disable them.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">7. Data Retention</h2>
          <p>
            We retain your account data and reports for as long as your account is active or as needed to provide the
            Service and comply with legal obligations. You may request deletion of your account and associated data
            subject to applicable retention requirements.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">8. Children</h2>
          <p>
            The Service is not directed at individuals under 18. We do not knowingly collect personal data from
            children. If you believe we have collected such data, please contact us so we can delete it.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the revised policy on this page and update
            the “Last updated” date. Continued use of the Service after changes constitutes acceptance of the updated
            policy.
          </p>

          <h2 className="font-display text-lg font-semibold text-foreground mt-8">10. Contact Us</h2>
          <p>
            For privacy-related questions or requests, contact us at support@clinilocker.com. CliniLocker is operated
            by RNJ PVT LTD.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <Link to="/" className="text-primary font-medium hover:underline">Back to Home</Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link to="/terms" className="text-primary font-medium hover:underline">Terms of Service</Link>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default PrivacyPolicy;
