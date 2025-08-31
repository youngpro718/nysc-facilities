import { createContext, useContext, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';
import { supabase as supabaseClient } from '@/lib/supabase';

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

export const useSupabaseClient = () => {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider');
  }
  return client;
};

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const client = useMemo(() => supabaseClient as unknown as SupabaseClient<Database>, []);
  
  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
};
