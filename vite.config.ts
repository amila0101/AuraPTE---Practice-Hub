import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "AuraPTE — AI-Powered PTE Practice",
        short_name: "AuraPTE",
        description: "Practice PTE Academic & PTE Core with real AI scoring. Covers Speaking, Writing, Reading and Listening with weekly exam predictions.",
        theme_color: "#2a9d5c",
        background_color: "#0f1a12",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/dashboard",
        lang: "en",
        categories: ["education", "productivity"],
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", label: "AuraPTE Dashboard" },
        ],
        shortcuts: [
          { name: "Practice Speaking", url: "/practice-list?type=speaking", icons: [{ src: "pwa-192.png", sizes: "192x192" }] },
          { name: "Mock Test", url: "/mock-test", icons: [{ src: "pwa-192.png", sizes: "192x192" }] },
          { name: "Predictions", url: "/predictions", icons: [{ src: "pwa-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/axbsktmitqicyvjaqeio\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
