import { useRef, useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";

type PreloaderProps = {
  /** When true, covers the full viewport (e.g. auth loading). When false, fits in flow (e.g. page data loading). */
  fullScreen?: boolean;
  /** Show branded video only for app cold-start splash. Keep false for route/page loading states. */
  showSplashVideo?: boolean;
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
  showSplashVideo = false,
  className = "",
  exiting = false,
  onExitComplete,
}: PreloaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (!showSplashVideo) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, [showSplashVideo]);

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
      {fullScreen && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-sky-50/30 to-white" />
      )}
      <div
        ref={innerRef}
        className="relative flex items-center justify-center w-full h-full max-w-[min(85vw,280px)] max-h-[min(85vw,280px)] sm:max-w-[min(80vw,320px)] sm:max-h-[min(80vw,320px)] md:max-w-[min(70vw,360px)] md:max-h-[min(70vw,360px)]"
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
        {showSplashVideo && !videoFailed ? (
          <video
            ref={videoRef}
            src="/preloaderr.mp4"
            poster="/logo%20(2).png"
            className={`w-full h-full object-contain pointer-events-none ${videoReady ? "opacity-100" : "opacity-0"}`}
            style={{ visibility: videoReady ? "visible" : "hidden" }}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
            preload="auto"
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            aria-label="Loading"
          />
        ) : (
          <div className="h-full w-full rounded-3xl border border-slate-200 bg-white/90 shadow-sm flex items-center justify-center p-4">
            <img
              src="/logo%20(2).png"
              alt="CliniLocker"
              className="h-[68%] w-[68%] object-contain animate-pulse"
              loading="eager"
            />
          </div>
        )}
        {showSplashVideo && !videoReady && !videoFailed && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-slate-200 bg-white/90">
            <img
              src="/logo%20(2).png"
              alt="CliniLocker"
              className="h-[68%] w-[68%] object-contain animate-pulse"
              loading="eager"
            />
          </div>
        )}
        {fullScreen && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs text-slate-600 shadow-sm flex items-center gap-1.5">
            <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
            Preparing your health dashboard
          </div>
        )}
      </div>
    </div>
  );
}
