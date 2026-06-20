import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getFriendlySupplyStatus, getFriendlyTaskStatus, toneClasses } from '@/lib/statusLabels';
import { RequestDetailBody } from './RequestDetailBody';
import { SupplyDetailBody } from './SupplyDetailBody';
import type { MyRequestRow, TaskRow, SupplyRow } from '@features/dashboard/hooks/useMyRequests';

interface Props {
  row: MyRequestRow | null;
  onOpenChange: (open: boolean) => void;
}

export function MyRequestDetailDrawer({ row, onOpenChange }: Props) {
  if (!row) return null;
  const friendly =
    row.type === 'supply'
      ? getFriendlySupplyStatus(row.status_internal)
      : getFriendlyTaskStatus(row.status_internal);

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-base flex items-center justify-between gap-2">
            <span className="truncate">{row.title}</span>
            <Badge variant="outline" className={`text-xs ${toneClasses(friendly.tone)}`}>
              {friendly.label}
            </Badge>
          </SheetTitle>
          <div className="text-xs text-muted-foreground">
            #{row.id.slice(0, 8).toUpperCase()} · Submitted {format(new Date(row.created_at), 'EEE MMM d, h:mm a')}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {row.type === 'request' ? (
            <RequestDetailBody task={row.raw as TaskRow} />
          ) : (
            <SupplyDetailBody supply={row.raw as SupplyRow} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
