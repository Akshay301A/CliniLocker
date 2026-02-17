/**
 * Local PDF.js worker — same version as pdfjs-dist, no CDN.
 * public/pdf.worker.min.js is copied on postinstall (see scripts/copy-pdf-worker.cjs).
 * Fixes version mismatch, DPI handling, and blur from external worker.
 */
export const PDF_WORKER_SRC = "/pdf.worker.min.js";
