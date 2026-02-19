import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";

interface AdSenseProps {
  /** Your AdSense publisher ID (e.g., "ca-pub-1234567890123456") */
  publisherId?: string;
  /** Your AdSense ad slot ID */
  adSlot?: string;
  /** Ad format - "auto" for responsive, "rectangle" for fixed size */
  format?: "auto" | "rectangle" | "horizontal";
  /** Minimum height for the ad container */
  minHeight?: number;
  /** Show placeholder when ad is not loaded */
  showPlaceholder?: boolean;
  /** Custom className for the container */
  className?: string;
}

/**
 * AdSense Component for displaying Google AdSense ads
 * 
 * Usage:
 * <AdSense 
 *   publisherId="ca-pub-YOUR_PUBLISHER_ID"
 *   adSlot="YOUR_AD_SLOT_ID"
 *   format="auto"
 * />
 */
export function AdSense({
  publisherId,
  adSlot,
  format = "auto",
  minHeight = 100,
  showPlaceholder = true,
  className = "",
}: AdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const adLoadedRef = useRef(false);
  const [adLoading, setAdLoading] = useState(true);

  useEffect(() => {
    // Only load AdSense if publisher ID and ad slot are provided
    if (!publisherId || !adSlot || adLoadedRef.current) return;

    // Check if AdSense script is already loaded
    const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');
    
    if (!existingScript) {
      // Load AdSense script
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Wait a bit for script to load, then initialize ad
    const timer = setTimeout(() => {
      if (adRef.current && (window as any).adsbygoogle) {
        try {
          (window as any).adsbygoogle.push({});
          adLoadedRef.current = true;
          setAdLoading(false);
        } catch (e) {
          console.error("AdSense error:", e);
          setAdLoading(false);
        }
      } else {
        setAdLoading(false);
      }
    }, 500);

    // Hide loading state after timeout
    const loadingTimeout = setTimeout(() => {
      setAdLoading(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(loadingTimeout);
    };
  }, [publisherId, adSlot]);

  // If no publisher ID or ad slot, show compact placeholder
  if (!publisherId || !adSlot) {
    if (!showPlaceholder) return null;
    
    return (
      <div 
        className={`w-full rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/30 dark:border-blue-800/30 flex items-center justify-center overflow-hidden ${className}`}
        style={{ minHeight: `${minHeight}px`, maxHeight: `${Math.max(minHeight, 80)}px` }}
      >
        <div className="text-center px-3 py-2">
          <Megaphone className="h-4 w-4 mx-auto mb-1 text-primary/60" />
          <p className="text-[10px] text-muted-foreground/70">
            Ads loading...
          </p>
        </div>
      </div>
    );
  }

  // Determine ad format styles with compact constraints for mobile
  const containerStyle: React.CSSProperties = {
    width: "100%",
    minHeight: format === "rectangle" ? "250px" : format === "horizontal" ? "90px" : `${minHeight}px`,
    maxHeight: format === "rectangle" ? "250px" : format === "horizontal" ? "90px" : "120px", // Reduced max height for mobile
    overflow: "hidden", // Prevent content overflow
    display: "block",
  };

  const adStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    minHeight: format === "rectangle" ? "250px" : format === "horizontal" ? "90px" : `${minHeight}px`,
    maxHeight: format === "rectangle" ? "250px" : format === "horizontal" ? "90px" : "120px", // Constrain ad height
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Health-related content wrapper to help AdSense targeting */}
      <div itemScope itemType="https://schema.org/MedicalOrganization" style={{ display: "none" }}>
        <meta itemProp="name" content="CliniLocker - Health Reports & Medical Records" />
        <meta itemProp="description" content="Secure health reports, medical records, lab results, and health management platform" />
        <meta itemProp="keywords" content="health, medical, lab reports, diagnostic, healthcare, wellness, medical records" />
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={format === "auto" ? "true" : "false"}
        // Add health-related keywords hint (though AdSense primarily uses page content)
        data-ad-keywords="health,medical,healthcare,wellness,lab reports,diagnostic,medical records"
      />
    </div>
  );
}
