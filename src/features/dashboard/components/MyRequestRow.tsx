import { Badge } from '@/components/ui/badge';
import { formatDistanceToNowStrict } from 'date-fns';
import { Package, HandHelping } from 'lucide-react';
import { getFriendlySupplyStatus, getFriendlyTaskStatus, toneClasses } from '@/lib/statusLabels';
import type { MyRequestRow as Row } from '@features/dashboard/hooks/useMyRequests';

interface Props {
  row: Row;
  onClick: () => void;
  highlighted?: boolean;
}

export function MyRequestRow({ row, onClick, highlighted }: Props) {
  const friendly =
    row.type === 'supply'
      ? getFriendlySupplyStatus(row.status_internal)
      : getFriendlyTaskStatus(row.status_internal);

  const TypeIcon = row.type === 'supply' ? Package : HandHelping;
  const typeLabel = row.type === 'supply' ? 'Supply' : 'Request';
  const shortId = `#${row.id.slice(0, 8).toUpperCase()}`;
  const relative = formatDistanceToNowStrict(new Date(row.created_at), { addSuffix: true });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b hover:bg-muted/40 transition-colors ${
        highlighted ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <TypeIcon className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {typeLabel}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{row.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {row.location_label || 'No location'} · {shortId}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <Badge variant="outline" className={`text-xs ${toneClasses(friendly.tone)}`}>
          {friendly.label}
        </Badge>
        <span className="text-[11px] text-muted-foreground mt-0.5">{relative}</span>
      </div>
    </button>
  );
}
