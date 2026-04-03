import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </div>
  );
}
