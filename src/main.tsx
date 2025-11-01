import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeStorage } from './services/storage.ts'
import { registerServiceWorker } from './utils/registerServiceWorker'

// Initialize storage buckets
initializeStorage().catch(err => {
  console.warn('Failed to initialize storage buckets:', err);
  // Continue loading the app even if bucket initialization fails
});

// Register service worker for PWA support (iOS 18+ compatible)
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: (registration) => {
      console.log('✅ PWA Service Worker registered successfully');
    },
    onUpdate: (registration) => {
      console.log('🔄 New version available! Please refresh to update.');
      // Optionally show a toast notification to the user
      if (confirm('A new version is available. Reload to update?')) {
        window.location.reload();
      }
    },
    onError: (error) => {
      console.error('❌ Service Worker registration failed:', error);
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
