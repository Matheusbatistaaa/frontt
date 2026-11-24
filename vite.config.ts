import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    open: true,
    allowedHosts: true,
    // Mesma origem para o front e a API: funciona local (localhost:3000/api) e
    // através do túnel Cloudflare, sem CORS e sem precisar de VITE_BACKEND_URL.
    proxy: {
      "/api": {
        target: "http://localhost:5198",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
