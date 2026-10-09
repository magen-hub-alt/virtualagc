import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  server: { port: 4173, strictPort: true },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "three/addons/controls/OrbitControls.js"],
        },
      },
    },
  },
});
