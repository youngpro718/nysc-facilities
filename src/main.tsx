import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeStorage } from './shared/utils/storage.ts'
import { registerServiceWorker } from './utils/registerServiceWorker'
import { toast } from 'sonner'

// Initialize storage buckets
initializeStorage().catch(err => {
  console.warn('Failed to initialize storage buckets:', err);
  // Continue loading the app even if bucket initialization fails
});

// Register service worker for PWA support (iOS 18+ compatible) - ONLY in production
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: (registration) => {

    },
    onUpdate: (registration) => {

      toast('A new version is available', {
        description: 'Reload to get the latest features and fixes.',
        action: {
          label: 'Reload',
          onClick: () => window.location.reload(),
        },
        duration: Infinity,
      });
    },
    onError: (error) => {
      console.error('❌ Service Worker registration failed:', error);
    },
  });
} else {
  // Unregister any existing service workers in development to prevent conflicts
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();

      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
