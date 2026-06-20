import { Calendar, MapPin, MessageSquare } from 'lucide-react';
import type { TaskRow } from '@features/dashboard/hooks/useMyRequests';
import { formatDateTime } from '@/lib/dateTime';

interface Props {
  task: TaskRow;
}

const TIMING_LABEL: Record<string, string> = {
  anytime: 'Anytime',
  when_court_is_down: 'When court is down',
  specific_time: 'By a specific time',
};

export function RequestDetailBody({ task }: Props) {
  const timing = task.timing_preference || 'anytime';
  const timingLabel = TIMING_LABEL[timing] || 'Anytime';
  const specificAt = task.requested_for_at
    ? formatDateTime(task.requested_for_at)
    : null;

  return (
    <div className="space-y-4 p-4">
      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <MapPin className="h-3.5 w-3.5" /> Where
        </div>
        <div className="text-sm">{task.from_room_id || task.to_room_id || 'No room recorded'}</div>
      </section>
      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <MessageSquare className="h-3.5 w-3.5" /> What
        </div>
        <div className="text-sm whitespace-pre-wrap">{task.description || ''}</div>
      </section>
      <section>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          <Calendar className="h-3.5 w-3.5" /> When
        </div>
        <div className="text-sm">
          {timingLabel}
          {specificAt && <span className="text-muted-foreground"> — {specificAt}</span>}
        </div>
      </section>
    </div>
  );
}
