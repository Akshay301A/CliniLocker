import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landing-theme flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </div>
  );
}
