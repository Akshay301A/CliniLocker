import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SUPPORT_EMAIL = "support@clinilocker.com";

function buildMailto({
  fullName,
  email,
  phone,
  reason,
}: {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}) {
  const subject = "Account deletion request";
  const bodyLines = [
    "Hello CliniLocker Support,",
    "",
    "I would like to delete my CliniLocker account and associated data.",
    "",
    `Name: ${fullName || "—"}`,
    `Email: ${email || "—"}`,
    `Phone: ${phone || "—"}`,
    `Reason (optional): ${reason || "—"}`,
    "",
    "Please confirm once the deletion is completed.",
  ];
  const body = encodeURIComponent(bodyLines.join("\n"));
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

const DeleteAccount = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const mailto = buildMailto({ fullName, email, phone, reason });
    window.location.href = mailto;
  };

  return (
    <PublicLayout>
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container px-4 max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <img src="/favicon.png" alt="" className="h-4 w-4 object-contain" /> Back to CliniLocker
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl">
            Delete Your Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="mt-8 sm:mt-10 space-y-6 text-sm sm:text-base text-muted-foreground">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">What happens when you request deletion</h2>
              <ul className="mt-3 list-disc list-inside space-y-2">
                <li>We verify your request to protect your account.</li>
                <li>Your account profile, reports, and linked data are scheduled for deletion.</li>
                <li>We complete deletion within 30 days unless we are required to retain data by law.</li>
                <li>You will receive a confirmation email once deletion is done.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Request deletion</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill in the details below. We will use them to verify your identity before deleting the account.
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Share any feedback (optional)." />
                </div>
                <Button type="submit" className="w-full sm:w-auto">Send deletion request</Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                If the button does not open your email app, send a request directly to {SUPPORT_EMAIL}.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <Link to="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</Link>
            <span className="mx-2 text-muted-foreground">·</span>
            <Link to="/terms" className="text-primary font-medium hover:underline">Terms of Service</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default DeleteAccount;
