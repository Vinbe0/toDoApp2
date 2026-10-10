import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // In development the app calls /api on its own origin and Vite forwards
    // it to the backend, so no CORS setup is needed.
    proxy: {
      "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3000",
    },
  },
});
