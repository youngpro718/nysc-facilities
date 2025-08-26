import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  actor_id: string;
  target_user_id: string;
  event_data: any;
  created_at: string;
  ip_address: string;
}

export function useSecurityMonitoring() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSecurityEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('security_monitoring')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSecurityEvents((data || []) as SecurityEvent[]);
    } catch (err: any) {
      console.error('Error loading security events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createSecurityAlert = async (
    alertType: string,
    severity: 'low' | 'medium' | 'high' = 'medium',
    details: Record<string, any> = {}
  ) => {
    try {
      const { data, error } = await supabase.rpc('create_security_alert', {
        alert_type: alertType,
        severity,
        details
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error creating security alert:', err);
      throw err;
    }
  };

  const auditRoleChange = async (
    targetUserId: string,
    oldRole: string,
    newRole: string,
    reason: string = 'Role change'
  ) => {
    try {
      const { error } = await supabase.rpc('audit_user_role_change', {
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole,
        reason
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error auditing role change:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadSecurityEvents();
  }, []);

  return {
    securityEvents,
    isLoading,
    error,
    loadSecurityEvents,
    createSecurityAlert,
    auditRoleChange
  };
}