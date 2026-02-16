import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { acceptFamilyInvite } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, UserPlus, Home } from "lucide-react";
import { Preloader } from "@/components/Preloader";

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"idle" | "prompt" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing invite token.");
      return;
    }
    if (!user) {
      setStatus("prompt");
      return;
    }
    if (status !== "idle" && status !== "prompt") return;
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

  const goToLogin = () => {
    const redirectUrl = `/patient/accept-invite?token=${encodeURIComponent(token ?? "")}`;
    navigate(`/patient-login?redirect=${encodeURIComponent(redirectUrl)}`, { replace: true });
  };

  if (status === "prompt") {
    return (
      <PublicLayout>
        <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-elevated">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="mt-5 font-display text-xl font-bold text-foreground sm:text-2xl">
              You're invited to join a family
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A family member has invited you to CliniLocker. Accept to view health reports they share with you.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button className="min-h-[44px] flex-1 sm:flex-initial" onClick={goToLogin}>
                <UserPlus className="mr-2 h-4 w-4" /> Accept
              </Button>
              <Button variant="outline" className="min-h-[44px] flex-1 sm:flex-initial" asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" /> Not now
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              You can open this link again later to accept.
            </p>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (status === "success") {
    return (
      <PublicLayout>
        <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-elevated">
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
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-elevated">
            <div className="flex justify-center">
              <XCircle className="h-14 w-14 text-destructive" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-foreground">Invalid or expired invite</h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            <Button className="mt-6" asChild>
              <Link to="/">Go to Home</Link>
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
