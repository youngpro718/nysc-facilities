import { createContext, useContext, useMemo } from 'react';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

export const useSupabaseClient = () => {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider');
  }
  return client;
};

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and anon key must be provided in environment variables');
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }, []);
  
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};
