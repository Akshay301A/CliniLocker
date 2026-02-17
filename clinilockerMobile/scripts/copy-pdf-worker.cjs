const fs = require("fs");
const path = require("path");
const pkgDir = path.dirname(require.resolve("pdfjs-dist/package.json"));
const src = path.join(pkgDir, "build", "pdf.worker.min.js");
const dest = path.join(process.cwd(), "public", "pdf.worker.min.js");
fs.copyFileSync(src, dest);
console.log("Copied PDF.js worker to public/pdf.worker.min.js");
