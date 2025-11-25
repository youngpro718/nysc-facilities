
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Intercept console.error to suppress WebSocket RSV1 errors
const originalConsoleError = console.error;
console.error = function(...args: any[]) {
  const message = args.join(' ');
  // Suppress RSV1 WebSocket errors from browser extensions
  if (message.includes('RSV1') || message.includes('ws error') || message.includes('Invalid WebSocket frame')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Suppress WebSocket compression errors that crash the dev server
process.on('uncaughtException', (err: any) => {
  if (err.code === 'WS_ERR_UNEXPECTED_RSV_1' || err.message?.includes('RSV1')) {
    // Silently suppress - this is caused by browser extensions
    return;
  }
  throw err; // Re-throw other errors
});

// Plugin to handle WebSocket errors gracefully
const handleWebSocketErrors = (): Plugin => ({
  name: 'handle-websocket-errors',
  configureServer(server) {
    // Intercept and suppress WebSocket errors
    const originalOn = server.ws.on?.bind(server.ws);
    if (originalOn) {
      server.ws.on = function(event: string, handler: any) {
        if (event === 'error') {
          const wrappedHandler = (err: any) => {
            // Silently ignore RSV1 errors from browser extensions
            if (err.code === 'WS_ERR_UNEXPECTED_RSV_1' || err.message?.includes('RSV1')) {
              return;
            }
            handler(err);
          };
          return originalOn(event, wrappedHandler);
        }
        return originalOn(event, handler);
      };
    }
    
    server.httpServer?.on('upgrade', (request, socket) => {
      // Remove compression headers to prevent RSV1 errors
      if (request.headers['sec-websocket-extensions']) {
        delete request.headers['sec-websocket-extensions'];
      }
      
      socket.on('error', (err: any) => {
        if (err.code === 'WS_ERR_UNEXPECTED_RSV_1' || err.message?.includes('RSV1')) {
          // Silently suppress and close socket
          socket.destroy();
        }
      });
    });
  },
});

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
    ],
    hmr: {
      // Let Vite determine the protocol/host/port automatically
      // This prevents issues where 'localhost' binding fails in tunneled environments
      clientPort: 8080,
      overlay: false, // Disable error overlay that can trigger refreshes
      protocol: 'ws', // Use ws instead of wss for local dev
      timeout: 30000, // Increase timeout to prevent premature reconnects
    },
    watch: {
      // Prevent excessive file watching that causes refresh loops
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      usePolling: false, // Use native file watching for better performance
      // Increase delay to batch rapid file changes (e.g., from IDE auto-save)
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    },
    fs: {
      // Strict file system access to prevent unnecessary file reads
      strict: true,
    },
  },
  plugins: [
    react(),
    // DISABLED: componentTagger can cause reload loops in dev
    // mode === 'development' && componentTagger(),
    handleWebSocketErrors(),
    mode === 'production' && VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache-v1',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30 // 30 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources-v1'
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'og-image.png'],
      manifest: {
        name: 'NYSC Facilities Hub',
        short_name: 'NYSC Hub',
        description: 'New York State Court Facilities Management System',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
}));
