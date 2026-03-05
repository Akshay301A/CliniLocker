import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

function sanitizeFileName(name: string): string {
  return (name || "Report")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim() || "Report";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function downloadPdfInApp(url: string, fileName: string): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, error: "Not running on native platform." };
  }

  try {
    const safeName = `${sanitizeFileName(fileName).replace(/\.pdf$/i, "")}.pdf`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: "Failed to fetch PDF." };
    const data = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(data);

    const result = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });

    return { ok: true, path: result.uri ?? safeName };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Download failed." };
  }
}

