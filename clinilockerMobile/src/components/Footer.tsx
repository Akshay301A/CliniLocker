import { Link } from "react-router-dom";
import { AppFooter } from "./AppFooter";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <img
              src="/logo%20(2).png"
              alt="CliniLocker"
              className="h-[150px] w-auto object-contain object-left"
            />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Secure digital health reports for every patient.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="inline-block py-1 hover:text-foreground">Features</Link></li>
              <li><Link to="/pricing" className="inline-block py-1 hover:text-foreground">Pricing</Link></li>
              <li><Link to="/about" className="inline-block py-1 hover:text-foreground">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="inline-block py-1 hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/privacy" className="inline-block py-1 hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Contact</h4>
            <ul className="space-y-1 text-sm text-muted-foreground break-words">
              <li>support@clinilocker.com</li>
              <li>+91 98765 43210</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} CliniLocker. Developed by CliniLocker developers. From RNJ PVT LTD. All rights reserved.
        </div>
      </div>
      <AppFooter />
    </footer>
  );
}
