import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeStorage } from './services/storage.ts'
import { registerServiceWorker } from './utils/registerServiceWorker'

// Initialize storage buckets
if (import.meta.env.PROD) {
  initializeStorage().catch(err => {
    console.warn('Failed to initialize storage buckets:', err);
  });
}

// Register service worker for PWA support (iOS 18+ compatible) - ONLY in production
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
} else {
  // Unregister any existing service workers in development to prevent conflicts
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('🧹 Unregistered service worker in development mode');
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
