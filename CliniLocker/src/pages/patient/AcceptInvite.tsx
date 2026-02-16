import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { acceptFamilyInvite } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Preloader } from "@/components/Preloader";

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing invite token.");
      return;
    }
    if (!user) {
      const redirectUrl = `/patient/accept-invite?token=${encodeURIComponent(token)}`;
      navigate(`/patient-login?redirect=${encodeURIComponent(redirectUrl)}`, { replace: true });
      return;
    }
    if (status !== "idle") return;
    setStatus("loading");
    acceptFamilyInvite(token).then((result) => {
      if (result.ok) {
        setStatus("success");
        toast.success("You're now linked. You can see reports shared with you under Family Reports.");
        setTimeout(() => navigate("/patient/dashboard", { replace: true }), 2000);
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Invalid or expired invite.");
      }
    });
  }, [authLoading, user, token, navigate, status]);

  if (status === "success") {
    return (
      <PublicLayout>
        <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 text-center shadow-elevated">
            <div className="flex justify-center">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-foreground">You're all set</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You're now linked to the family. Redirecting to your dashboard…
            </p>
            <Button className="mt-6" asChild>
              <Link to="/patient/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (status === "error") {
    return (
      <PublicLayout>
        <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 text-center shadow-elevated">
            <div className="flex justify-center">
              <XCircle className="h-14 w-14 text-destructive" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-foreground">Invalid or expired invite</h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            <Button className="mt-6" asChild>
              <Link to="/patient/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
        <Preloader />
      </section>
    </PublicLayout>
  );
};

export default AcceptInvitePage;
