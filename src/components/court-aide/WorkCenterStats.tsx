/**
 * WorkCenterStats Component
 * 
 * Quick statistics summary for Court Aide dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
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

      // My active tasks (claimed or in_progress)
      const { count: myActiveCount } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .or(`claimed_by.eq.${user?.id},assigned_to.eq.${user?.id}`)
        .in('status', ['claimed', 'in_progress']);

      // Available tasks (approved, unclaimed)
      const { count: availableCount } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('claimed_by', null);

      // Completed today by me
      const { count: completedCount } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('claimed_by', user?.id)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      // Supplies fulfilled today
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

  const statItems = [
    {
      label: 'My Tasks',
      value: stats?.myActiveTasks ?? '-',
      icon: ClipboardCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Available',
      value: stats?.availableTasks ?? '-',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Completed Today',
      value: stats?.completedToday ?? '-',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Supplies Fulfilled',
      value: stats?.suppliesFulfilled ?? '-',
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((stat) => (
        <Card key={stat.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
