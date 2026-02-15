import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createLabAndJoin } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const LabCompleteSignupPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [labName, setLabName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (role === "lab") {
      navigate("/lab/dashboard", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName.trim()) {
      toast.error("Please enter your lab name.");
      return;
    }
    setLoading(true);
    const result = await createLabAndJoin(labName.trim(), phone.trim());
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Lab created! Welcome to CliniLocker.");
    navigate("/lab/dashboard", { replace: true });
  };

  if (authLoading || !user || role === "lab") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <PublicLayout>
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-elevated sm:p-8">
          <div className="mb-5 sm:mb-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl gradient-primary overflow-hidden">
              <img src="/Logo.svg" alt="CliniLocker" className="h-6 w-6 sm:h-7 sm:w-7 object-contain" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Complete Lab Setup</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Add your lab details to start using the dashboard.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="labName">Lab Name</Label>
              <Input
                id="labName"
                className="min-h-[44px]"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="City Diagnostics"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (optional)</Label>
              <Input
                id="phone"
                className="min-h-[44px]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
              {loading ? "Creating…" : "Continue to Dashboard"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">Back to Log in</Link>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
};

export default LabCompleteSignupPage;
