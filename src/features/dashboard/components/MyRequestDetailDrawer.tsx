import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFriendlyKeyStatus, getFriendlySupplyStatus, getFriendlyTaskStatus, toneClasses } from '@/lib/statusLabels';
import { RequestDetailBody } from './RequestDetailBody';
import { SupplyDetailBody } from './SupplyDetailBody';
import type { MyRequestRow, TaskRow, SupplyRow, KeyRequestRow } from '@features/dashboard/hooks/useMyRequests';
import { formatDateTime } from '@/lib/dateTime';
import { formatRequestId } from '@/lib/requestIds';
import { cancelKeyRequest } from '@features/keys/services/keyRequestService';
import { cancelStaffTaskRequest } from '@features/tasks/hooks/useStaffTasks';
import { cancelSupplyRequest } from '@features/supply/services/unifiedSupplyService';
import { getErrorMessage } from '@/lib/errorUtils';
import { useAuth } from '@features/auth/hooks/useAuth';

interface Props {
  row: MyRequestRow | null;
  onOpenChange: (open: boolean) => void;
}

const CANCELLABLE_TASK_STATUSES = new Set(['pending_approval', 'approved']);
const CANCELLABLE_SUPPLY_STATUSES = new Set(['pending_approval', 'submitted']);

export function MyRequestDetailDrawer({ row, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [cancelling, setCancelling] = useState(false);

  if (!row) return null;
  const keyRow = row.type === 'key' ? (row.raw as KeyRequestRow) : null;
  const taskRow = row.type === 'request' ? (row.raw as TaskRow) : null;
  const supplyRow = row.type === 'supply' ? (row.raw as SupplyRow) : null;

  const canCancelKey = !!keyRow && keyRow.status === 'pending';
  const canCancelTask =
    !!taskRow && CANCELLABLE_TASK_STATUSES.has(taskRow.status) && !taskRow.claimed_by;
  const canCancelSupply = !!supplyRow && CANCELLABLE_SUPPLY_STATUSES.has(supplyRow.status);

  const invalidateMyRequests = () =>
    queryClient.invalidateQueries({ queryKey: ['my-requests', user?.id] });

  const handleCancelKey = async () => {
    if (!keyRow) return;
    setCancelling(true);
    try {
      await cancelKeyRequest(keyRow.id);
      await invalidateMyRequests();
      toast.success('Key request cancelled');
      onOpenChange(false);
    } catch {
      toast.error('Could not cancel the request.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelTask = async () => {
    if (!taskRow) return;
    setCancelling(true);
    try {
      await cancelStaffTaskRequest(taskRow.id);
      await invalidateMyRequests();
      toast.success('Request cancelled');
      onOpenChange(false);
    } catch (error) {
      toast.error('Could not cancel the request.', { description: getErrorMessage(error) });
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelSupply = async () => {
    if (!supplyRow) return;
    setCancelling(true);
    try {
      await cancelSupplyRequest(supplyRow.id);
      await invalidateMyRequests();
      toast.success('Supply order cancelled');
      onOpenChange(false);
    } catch (error) {
      toast.error('Could not cancel the order.', { description: getErrorMessage(error) });
    } finally {
      setCancelling(false);
    }
  };
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
            <>
              <RequestDetailBody task={row.raw as TaskRow} locationLabel={row.location_label} />
              {canCancelTask && (
                <div className="border-t px-4 pb-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelTask}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Cancel request
                  </Button>
                </div>
              )}
            </>
          ) : row.type === 'key' && keyRow ? (
            <div className="space-y-4 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Type: </span>
                <span className="capitalize">{keyRow.request_type}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Location: </span>
                {row.location_label || keyRow.room_other || 'Not specified'}
              </p>
              <p className="whitespace-pre-wrap">{keyRow.reason}</p>
              <p><span className="text-muted-foreground">Quantity: </span>{keyRow.quantity}</p>
              {keyRow.rejection_reason && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-destructive mb-1">Reason for rejection</p>
                  <p className="whitespace-pre-wrap">{keyRow.rejection_reason}</p>
                </div>
              )}
              {canCancelKey && (
                <div className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelKey}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Cancel this request
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <SupplyDetailBody supply={row.raw as SupplyRow} />
              {canCancelSupply && (
                <div className="border-t px-4 pb-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSupply}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Cancel order
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
