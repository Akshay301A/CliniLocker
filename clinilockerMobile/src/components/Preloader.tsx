import { useRef, useEffect } from "react";

type PreloaderProps = {
  /** When true, covers the full viewport (e.g. auth loading). When false, fits in flow (e.g. page data loading). */
  fullScreen?: boolean;
  /** Optional className for the wrapper. */
  className?: string;
  /** When true, animates preloader shrinking and fading out in place (center), then calls onExitComplete. */
  exiting?: boolean;
  /** Called when the exit animation finishes. Only used when fullScreen and exiting. */
  onExitComplete?: () => void;
};

const EXIT_DURATION_MS = 600;

/**
 * 3s video preloader. Responsive and mobile-friendly: size scales with viewport (clamp).
 * Use fullScreen for app/auth loading; use inline for page-level loading.
 * When exiting (fullScreen), shrinks and fades out in place at center, then disappears.
 */
export function Preloader({
  fullScreen = false,
  className = "",
  exiting = false,
  onExitComplete,
}: PreloaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!fullScreen || !exiting || !onExitComplete) return;
    const el = innerRef.current;
    let completed = false;
    const done = () => {
      if (completed) return;
      completed = true;
      if (el) el.removeEventListener("transitionend", done);
      onExitComplete();
    };
    if (!el) {
      done();
      return;
    }
    el.addEventListener("transitionend", done);
    const t = setTimeout(done, EXIT_DURATION_MS + 100);
    return () => {
      if (el) el.removeEventListener("transitionend", done);
      clearTimeout(t);
    };
  }, [fullScreen, exiting, onExitComplete]);

  const wrapperClass = fullScreen
    ? "fixed inset-0 z-[100] flex items-center justify-center bg-background"
    : "flex min-h-[200px] items-center justify-center py-12";

  const isExitAnimation = fullScreen && exiting;

  return (
    <div className={`${wrapperClass} ${className}`} aria-hidden="true">
      <div
        ref={innerRef}
        className="flex items-center justify-center w-full h-full max-w-[min(85vw,280px)] max-h-[min(85vw,280px)] sm:max-w-[min(80vw,320px)] sm:max-h-[min(80vw,320px)] md:max-w-[min(70vw,360px)] md:max-h-[min(70vw,360px)]"
        style={{
          aspectRatio: "1",
          ...(fullScreen
            ? {
                position: "fixed",
                left: "50%",
                top: "50%",
                transform: isExitAnimation
                  ? "translate(-50%, -50%) scale(0)"
                  : "translate(-50%, -50%) scale(1)",
                opacity: isExitAnimation ? 0 : 1,
                transition: `transform ${EXIT_DURATION_MS}ms cubic-bezier(0.33, 1, 0.68, 1), opacity ${EXIT_DURATION_MS}ms ease-out`,
              }
            : {}),
        }}
      >
        <video
          ref={videoRef}
          src="/preloaderr.mp4"
          className="w-full h-full object-contain"
          autoPlay
          loop
          muted
          playsInline
          aria-label="Loading"
        />
      </div>
    </div>
  );
}
