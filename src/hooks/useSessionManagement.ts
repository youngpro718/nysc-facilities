
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

export function useSessionManagement() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cache session check using localStorage
  const getStoredSession = () => {
    const storedSession = localStorage.getItem('cachedSession');
    return storedSession ? JSON.parse(storedSession) : null;
  };

  const cacheSession = (newSession: Session | null) => {
    if (newSession) {
      localStorage.setItem('cachedSession', JSON.stringify(newSession));
    } else {
      localStorage.removeItem('cachedSession');
    }
  };

  // Debounced session refresh
  const refreshSession = useCallback(
    debounce(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        cacheSession(currentSession);
        return currentSession;
      } catch (error) {
        console.error('Error refreshing session:', error);
        return null;
      }
    }, 1000),
    []
  );

  // Initial session setup
  useEffect(() => {
    const setupSession = async () => {
      try {
        setLoading(true);
        
        // First check cached session
        const cachedSession = getStoredSession();
        if (cachedSession) {
          setSession(cachedSession);
          setLoading(false);
        }
        
        // Then verify with server
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          cacheSession(currentSession);
        } else {
          setSession(null);
          cacheSession(null);
          navigate('/login');
        }
      } catch (error) {
        console.error('Error setting up session:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    setupSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        cacheSession(null);
        navigate('/login');
      } else if (newSession) {
        setSession(newSession);
        cacheSession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    session,
    loading,
    refreshSession,
  };
}
