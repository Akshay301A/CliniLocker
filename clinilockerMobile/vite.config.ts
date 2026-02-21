import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { existsSync } from "fs";

// Use stub when @capacitor/local-notifications is not installed (e.g. fresh clone) so dev server runs
const useNotificationsStub = !existsSync(
  path.resolve(__dirname, "node_modules/@capacitor/local-notifications")
);

export default defineConfig({
  optimizeDeps: {
    exclude: ["date-fns"],
  },
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(useNotificationsStub && {
        "@capacitor/local-notifications": path.resolve(
          __dirname,
          "src/lib/capacitor-local-notifications-stub.ts"
        ),
      }),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
});
