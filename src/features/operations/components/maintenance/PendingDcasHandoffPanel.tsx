/**
 * PendingDcasHandoffPanel
 *
 * The single dashboard surface that answers: "What have I scheduled that I
 * still need to tell DCAS about?" Pulls maintenance_schedules with
 * external_ticket_status IN ('not_notified', 'notified') and shows them ranked
 * by urgency (soonest scheduled work first).
 *
 * Past-due unconfirmed work surfaces in red — the safety net for "did I
 * forget to call DCAS?"
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict, format, isPast } from 'date-fns';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listPendingHandoffs,
  handoffUrgency,
  type MaintenanceWithHandoff,
  type HandoffUrgency,
} from '@features/operations/services/maintenanceHandoff';
import { DcasHandoffDialog } from './DcasHandoffDialog';
import { cn } from '@/lib/utils';

const URGENCY_LABEL: Record<HandoffUrgency, string> = {
  past_due: 'Past due — was never handed off',
  urgent: 'Notify DCAS now',
  soon: 'Notify DCAS soon',
  quiet: 'Awaiting notification',
};

const URGENCY_CLASS: Record<HandoffUrgency, string> = {
  past_due: 'border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/[0.08]',
  urgent: 'border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/[0.08]',
  soon: 'border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/[0.08]',
  quiet: 'border-border text-muted-foreground bg-transparent',
};

const URGENCY_DOT: Record<HandoffUrgency, string> = {
  past_due: 'bg-red-500',
  urgent: 'bg-red-500',
  soon: 'bg-amber-500',
  quiet: 'bg-slate-400',
};

export function PendingDcasHandoffPanel() {
  const [selected, setSelected] = useState<MaintenanceWithHandoff | null>(null);
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery<MaintenanceWithHandoff[]>({
    queryKey: ['pending-dcas-handoffs'],
    queryFn: listPendingHandoffs,
    staleTime: 60_000,
  });

  const overdueCount = items.filter(i => isPast(new Date(i.scheduled_start_date))).length;
  const totalCount = items.length;

  return (
    <>
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <header className="border-b border-border bg-muted/20 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Pending DCAS handoff
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Maintenance you've scheduled but still need to notify DCAS about.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular leading-none">{totalCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {overdueCount > 0 ? (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {overdueCount} past due
                  </span>
                ) : (
                  'awaiting notification'
                )}
              </p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-2 p-4 sm:p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 sm:px-5 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium">All scheduled work is handed off.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You're caught up. New items will appear here when scheduled.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map(item => (
              <PendingRow
                key={item.id}
                item={item}
                onOpen={() => {
                  setSelected(item);
                  setOpen(true);
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <DcasHandoffDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSelected(null);
        }}
        item={selected}
      />
    </>
  );
}

function PendingRow({
  item,
  onOpen,
}: {
  item: MaintenanceWithHandoff;
  onOpen: () => void;
}) {
  const urgency = handoffUrgency(item.scheduled_start_date);
  const scheduledDate = new Date(item.scheduled_start_date);
  const notifiedButNoTicket = item.external_ticket_status === 'notified';

  return (
    <li className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3">
      {/* Title + location */}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">
          {prettyType(item.maintenance_type)} · {item.title}
        </p>
        {item.space_name && (
          <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {item.space_name}
          </p>
        )}
      </div>

      {/* Schedule + handoff status */}
      <div className="min-w-0 text-xs">
        <p className="text-muted-foreground inline-flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0" />
          {format(scheduledDate, 'EEE, MMM d')}
          <span className="hidden sm:inline">
            · {formatDistanceToNowStrict(scheduledDate, { addSuffix: true })}
          </span>
        </p>
        <span
          className={cn(
            'mt-1 inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium',
            URGENCY_CLASS[urgency],
          )}
        >
          <span
            aria-hidden="true"
            className={cn('h-1.5 w-1.5 rounded-full', URGENCY_DOT[urgency])}
          />
          {URGENCY_LABEL[urgency]}
          {notifiedButNoTicket && (
            <span className="ml-1 text-[10px] opacity-80">· awaiting ticket #</span>
          )}
        </span>
      </div>

      {/* Action */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpen}
        className="shrink-0 h-8"
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
        {urgency === 'past_due' ? 'Log it' : 'Notify DCAS'}
      </Button>
    </li>
  );
}

function prettyType(t: string): string {
  if (!t) return 'Maintenance';
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ');
}
