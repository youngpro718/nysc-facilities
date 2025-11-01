import { createContext, useContext, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
// Database type not needed for this context
import { supabase as supabaseClient } from '@/lib/supabase';

const SupabaseContext = createContext<SupabaseClient<any> | null>(null);

export const useSupabaseClient = () => {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider');
  }
  return client;
};

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const client = useMemo(() => supabaseClient as any, []);
  
  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
};
