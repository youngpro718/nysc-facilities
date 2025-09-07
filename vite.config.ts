
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      // Windsurf/Windsurf build preview proxies often use 127.0.0.1
      // Keep lovable preview hostname for cloud previews
      "e785d8ca-c2d1-4fcc-af24-583a7e48eaa6.lovableproject.com",
    ]
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
