import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "App", href: "#app" },
  { label: "Stats", href: "#stats" },
  { label: "Testimonials", href: "#testimonials" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 py-5"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="w-full rounded-full bg-white/95 shadow-lg h-16 transition-all duration-300">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <a href="/" className="flex items-center gap-3">
              <img
                src="/logo (2).png"
                alt="CliniLocker logo"
                className="h-35 w-[240px] object-contain"
              />
            </a>

            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200 text-sm"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <a href="/patient-login" className="glossy-btn text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hidden md:inline-flex">
                For Patients
              </a>
              <a href="/hms-coming-soon" className="glass-card px-5 py-2.5 rounded-full text-sm font-semibold hidden md:inline-flex text-foreground">
                HMS (Coming Soon)
              </a>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden text-foreground p-2"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-card mx-2 mt-3 rounded-2xl overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-3">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-foreground hover:text-primary font-medium py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <a href="/patient-login" className="glossy-btn text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold text-center mt-2">
                  For Patients
                </a>
                <a href="/hms-coming-soon" className="glass-card px-5 py-2.5 rounded-full text-sm font-semibold text-center">
                  HMS (Coming Soon)
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
