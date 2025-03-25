
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeStorage } from './services/storage.ts'
import { supabase } from './integrations/supabase/client.ts'

// Listen for authentication state changes to properly initialize storage
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    console.log('User signed in, initializing storage...');
    initializeStorage().catch(err => {
      console.warn('Failed to initialize storage after sign in:', err);
    });
  }
});

// Initialize storage on application startup (if user is already logged in)
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    console.log('Existing session found, initializing storage...');
    initializeStorage().catch(err => {
      console.warn('Failed to initialize storage buckets:', err);
    });
  } else {
    console.log('No active session, storage will be initialized on login');
  }
});

createRoot(document.getElementById("root")!).render(<App />);
