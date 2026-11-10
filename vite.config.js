import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:5049", changeOrigin: false },
      "/uploads/companies": { target: "http://localhost:5049", changeOrigin: false },
      "/uploads/avatars": { target: "http://localhost:5049", changeOrigin: false },
    },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
