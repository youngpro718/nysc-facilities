import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Package, Truck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusHistoryTimelineProps {
  requestId: string;
  className?: string;
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  notes: string | null;
  changed_by: string | null;
  changed_at: string;
  changer?: {
    first_name: string;
    last_name: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  submitted: { icon: Clock, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', label: 'Submitted' },
  pending_approval: { icon: AlertTriangle, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30', label: 'Awaiting Approval' },
  approved: { icon: CheckCircle2, color: 'text-green-500 bg-green-100 dark:bg-green-900/30', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500 bg-red-100 dark:bg-red-900/30', label: 'Rejected' },
  received: { icon: Package, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', label: 'Received by Supply Room' },
  picking: { icon: Package, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30', label: 'Picking Items' },
  ready: { icon: Truck, color: 'text-green-500 bg-green-100 dark:bg-green-900/30', label: 'Ready for Pickup' },
  completed: { icon: CheckCircle2, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'text-gray-500 bg-gray-100 dark:bg-gray-900/30', label: 'Cancelled' },
};

export function StatusHistoryTimeline({ requestId, className }: StatusHistoryTimelineProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['supply-request-history', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_request_status_history')
        .select(`
          id,
          status,
          notes,
          changed_by,
          changed_at,
          changer:changed_by (
            first_name,
            last_name
          )
        `)
        .eq('request_id', requestId)
        .order('changed_at', { ascending: true });

      if (error) throw error;
      
      // Map data to handle array vs single object from join
      return (data || []).map((entry: any) => ({
        ...entry,
        changer: Array.isArray(entry.changer) ? entry.changer[0] || null : entry.changer,
      })) as StatusHistoryEntry[];
    },
    enabled: !!requestId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No status history yet</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical line connecting timeline */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />

      <div className="space-y-4">
        {history.map((entry, index) => {
          const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.submitted;
          const Icon = config.icon;
          const isLast = index === history.length - 1;
          const changerName = entry.changer 
            ? `${entry.changer.first_name} ${entry.changer.last_name}`
            : null;

          return (
            <div key={entry.id} className="flex gap-3 relative">
              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                config.color,
                isLast && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {format(new Date(entry.changed_at), "MMM d, yyyy 'at' h:mm a")}
                  {changerName && (
                    <span className="ml-1">
                      by <span className="font-medium">{changerName}</span>
                    </span>
                  )}
                </div>

                {entry.notes && (
                  <div className="mt-2 text-sm bg-muted/50 p-2 rounded text-muted-foreground">
                    {entry.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
