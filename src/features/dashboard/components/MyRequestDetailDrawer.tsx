import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { getFriendlyKeyStatus, getFriendlySupplyStatus, getFriendlyTaskStatus, toneClasses } from '@/lib/statusLabels';
import { RequestDetailBody } from './RequestDetailBody';
import { SupplyDetailBody } from './SupplyDetailBody';
import type { MyRequestRow, TaskRow, SupplyRow, KeyRequestRow } from '@features/dashboard/hooks/useMyRequests';
import { formatDateTime } from '@/lib/dateTime';
import { formatRequestId } from '@/lib/requestIds';

interface Props {
  row: MyRequestRow | null;
  onOpenChange: (open: boolean) => void;
}

export function MyRequestDetailDrawer({ row, onOpenChange }: Props) {
  if (!row) return null;
  const friendly = row.type === 'supply'
    ? getFriendlySupplyStatus(row.status_internal)
    : row.type === 'key'
      ? getFriendlyKeyStatus(row.status_internal)
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
            #{formatRequestId(row.id, row.display_id)} · Submitted {formatDateTime(row.created_at)}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {row.type === 'request' ? (
            <RequestDetailBody task={row.raw as TaskRow} locationLabel={row.location_label} />
          ) : row.type === 'key' ? (
            <div className="space-y-4 p-4 text-sm">
              <p><span className="text-muted-foreground">Location: </span>{(row.raw as KeyRequestRow).room_other || (row.raw as KeyRequestRow).room_id || 'Not specified'}</p>
              <p className="whitespace-pre-wrap">{(row.raw as KeyRequestRow).reason}</p>
              <p><span className="text-muted-foreground">Quantity: </span>{(row.raw as KeyRequestRow).quantity}</p>
              {(row.raw as KeyRequestRow).rejection_reason && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3">{(row.raw as KeyRequestRow).rejection_reason}</p>
              )}
            </div>
          ) : (
            <SupplyDetailBody supply={row.raw as SupplyRow} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
