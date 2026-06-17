import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "src/",
  plugins: [tailwindcss()],
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        jobs: resolve(__dirname, "src/jobs.html"),
        favourites: resolve(__dirname, "src/favourites.html"),
        jobDetails: resolve(__dirname, "src/jobs/details.html"),
        dashboard: resolve(__dirname, "src/dashboard.html"),
      },
    },
  },
});
