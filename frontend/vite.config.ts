import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_TARGET ?? "http://localhost:6001";
const minioTarget = process.env.MINIO_TARGET ?? "http://localhost:9000";

const proxyConfig = {
  "/api": { target: apiTarget, changeOrigin: true },
  "/socket.io": { target: apiTarget, changeOrigin: true, ws: true },
  "/uploads": {
    target: minioTarget,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/uploads/, "/vreal"),
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: proxyConfig,
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
    proxy: proxyConfig,
  },
});
