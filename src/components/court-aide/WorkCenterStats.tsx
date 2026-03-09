/**
 * WorkCenterStats Component
 * 
 * Quick statistics summary for Court Aide dashboard
 * Uses StatusCard pattern with left-border indicators
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { StatusCard } from '@/components/ui/StatusCard';
import { ClipboardCheck, Package, Clock, TrendingUp } from 'lucide-react';

interface WorkStats {
  myActiveTasks: number;
  availableTasks: number;
  completedToday: number;
  suppliesFulfilled: number;
}

export function WorkCenterStats() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['court-aide-work-stats', user?.id],
    queryFn: async (): Promise<WorkStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: myActiveCount } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .or(`claimed_by.eq.${user?.id},assigned_to.eq.${user?.id}`)
        .in('status', ['claimed', 'in_progress']);

      const { count: availableCount } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('claimed_by', null);

      const { count: completedCount } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('claimed_by', user?.id)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      const { count: suppliesCount } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .eq('fulfilled_by', user?.id)
        .gte('fulfilled_at', today.toISOString());

      return {
        myActiveTasks: myActiveCount || 0,
        availableTasks: availableCount || 0,
        completedToday: completedCount || 0,
        suppliesFulfilled: suppliesCount || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatusCard
        title="My Tasks"
        value={stats?.myActiveTasks ?? 0}
        icon={ClipboardCheck}
        statusVariant={stats?.myActiveTasks ? 'info' : 'none'}
      />
      <StatusCard
        title="Available"
        value={stats?.availableTasks ?? 0}
        icon={Clock}
        statusVariant={stats?.availableTasks ? 'warning' : 'none'}
      />
      <StatusCard
        title="Completed Today"
        value={stats?.completedToday ?? 0}
        icon={TrendingUp}
        statusVariant="operational"
      />
      <StatusCard
        title="Supplies Fulfilled"
        value={stats?.suppliesFulfilled ?? 0}
        icon={Package}
        statusVariant="info"
      />
    </div>
  );
}
