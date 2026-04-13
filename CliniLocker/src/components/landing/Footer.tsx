const Footer = () => {
  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-10 mb-12 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-20 w-80 rounded-2xl bg-white/90 border border-white/60 shadow-sm flex items-center justify-center overflow-hidden">
                <img src="/logo (2).png" alt="CliniLocker logo" className="h-30 w-30 object-contain" />
              </div>
            </div>
            <p className="text-background/50 text-sm leading-relaxed">
              Securely store, access, and share health reports with CliniLocker.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/medical-brains" className="text-background/50 hover:text-primary text-sm transition-colors">
                  Clinical Advisory Board
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-background/50 hover:text-primary text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-background/50 hover:text-primary text-sm transition-colors">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/40 text-sm">© 2026 CliniLocker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
