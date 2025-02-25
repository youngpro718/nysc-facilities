
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function MaintenancePage() {
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'general_settings')
        .single();

      if (error) throw error;
      return data?.value as { maintenance_mode: boolean } | null;
    }
  });

  useEffect(() => {
    // If maintenance mode is disabled, redirect to home
    if (settings && !settings.maintenance_mode) {
      navigate('/');
    }
  }, [settings, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <Wrench className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-4xl font-bold">System Maintenance</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The system is currently undergoing maintenance. Please try again later.
        </p>
      </div>
    </div>
  );
}
