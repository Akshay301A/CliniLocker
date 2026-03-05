import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PDF_WORKER_SRC } from "@/lib/pdfWorker";

type PdfBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
};

export function PdfBottomSheet({ open, onOpenChange, url, title }: PdfBottomSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) setZoom(1);
  }, [open, url]);

  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setPageImages([]);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch PDF.");
        const data = await response.arrayBuffer();

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;

        const renderedPages: string[] = [];
        const targetWidth = Math.max(340, Math.min(window.innerWidth - 28, 980));
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) return;
          const page = await pdfDoc.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / Math.max(baseViewport.width, 1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
          canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const context = canvas.getContext("2d", { alpha: false });
          if (!context) continue;
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, viewport.width, viewport.height);

          await page.render({ canvasContext: context, viewport }).promise;
          renderedPages.push(canvas.toDataURL("image/png"));
        }

        if (!cancelled) setPageImages(renderedPages);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to open PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPdf();
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto h-[88vh] max-w-4xl rounded-t-2xl">
        <DrawerHeader className="border-b border-border/60 pb-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle className="truncate text-base">{title}</DrawerTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="Close PDF viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>
        <div className="border-b border-border/60 bg-background px-3 py-2">
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 min-w-[72px] px-2 text-xs"
              onClick={() => setZoom(1)}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#f3f4f6] p-3">
          {!url && (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              PDF unavailable.
            </div>
          )}

          {url && loading && (
            <div className="flex h-full min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading PDF...
            </div>
          )}

          {url && !loading && error && (
            <div className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-background p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => window.open(url, "_blank")}
              >
                Open in browser
              </Button>
            </div>
          )}

          {url && !loading && !error && pageImages.length > 0 && (
            <div className="mx-auto w-full max-w-3xl space-y-3">
              {pageImages.map((src, index) => (
                <img
                  key={`${index}-${src.length}`}
                  src={src}
                  alt={`PDF page ${index + 1}`}
                  className="rounded-lg border border-border/60 bg-white shadow-sm"
                  style={{
                    width: `${Math.round(zoom * 100)}%`,
                    maxWidth: "none",
                  }}
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
