import { Heart, Landmark } from "lucide-react";

/** Compact footer strip: respect to India + respect to health. Shown at bottom of every screen. */
export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30 py-4 px-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <img
            src="https://flagcdn.com/w80/in.png"
            srcSet="https://flagcdn.com/w160/in.png 2x"
            alt="India"
            className="h-6 w-9 sm:h-7 sm:w-10 shrink-0 object-contain rounded-sm border border-border/50"
            width={36}
            height={24}
          />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
            <Landmark className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="font-medium text-foreground/90">Proudly made in India</span>
            <span className="hidden sm:inline"> — Atmanirbhar Bharat</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
            <Heart className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="font-medium text-foreground/90">Your health, our priority</span>
            <span className="hidden sm:inline"> — Care in your hands</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
