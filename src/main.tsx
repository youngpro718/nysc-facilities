
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeStorage } from './services/storage.ts'

// Initialize storage buckets
initializeStorage().catch(err => {
  console.warn('Failed to initialize storage buckets:', err);
  // Continue loading the app even if bucket initialization fails
});

createRoot(document.getElementById("root")!).render(<App />);
