
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './integrations/supabase/client.ts'

// Set a maximum timeout to attempt storage initialization
const STORAGE_INIT_TIMEOUT = 5000; // 5 seconds

// Don't attempt to initialize storage in main.tsx to avoid race conditions
// All storage initialization will happen through the AuthContext after authentication
// This prevents loading issues and ensures proper order of operations

createRoot(document.getElementById("root")!).render(<App />);
