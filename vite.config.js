import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Keep generated optimizer files separate from the legacy cache tracked in Git.
  cacheDir: ".cache/vite",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:5049", changeOrigin: false, ws: true },
      "/uploads/companies": { target: "http://localhost:5049", changeOrigin: false },
      "/uploads/avatars": { target: "http://localhost:5049", changeOrigin: false },
      "/uploads/cv-decorations": { target: "http://localhost:5049", changeOrigin: false },
    },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
