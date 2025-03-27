
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { initializeStorage } from './services/storage.ts'

// Create a client
const queryClient = new QueryClient()

// Initialize storage buckets
initializeStorage().catch(err => {
  console.warn('Failed to initialize storage buckets:', err);
  // Continue loading the app even if bucket initialization fails
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);
