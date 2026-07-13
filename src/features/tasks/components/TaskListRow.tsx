/**
 * TaskListRow Component
 *
 * Compact one-line-per-task rendering for the Tasks page list view. Same
 * action semantics as TaskCard (claim/start/complete, approve/reject,
 * cancel/release/delete) with the details kept scannable: title first, then
 * route, requester, and timing on a muted second line.
 */

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Play,
  User,
  MapPin,
  ArrowRight,
  MoreVertical,
  Loader2,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isPast } from 'date-fns';
import type { StaffTask } from '@features/tasks/types/staffTasks';
import {
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@features/tasks/types/staffTasks';
import { formatDateTime } from '@/lib/dateTime';

interface TaskListRowProps {
  task: StaffTask;
  showActions?: boolean;
  onClaim?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onComplete?: (taskId: string, notes?: string) => void;
  onCancel?: (taskId: string) => void;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string, reason: string) => void;
  onDelete?: (taskId: string) => void;
  onReleaseClaim?: (taskId: string) => void;
  isLoading?: boolean;
}

const PRIORITY_DOT_COLORS: Record<StaffTask['priority'], string> = {
  low: 'bg-status-neutral',
  medium: 'bg-status-info',
  high: 'bg-status-warning',
  urgent: 'bg-status-critical',
};

export function TaskListRow({
  task,
  showActions = true,
  onClaim,
  onStart,
  onComplete,
  onCancel,
  onApprove,
  onReject,
  onDelete,
  onReleaseClaim,
  isLoading,
}: TaskListRowProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const canClaim = (task.status === 'approved' || task.status === 'pending_approval') && !task.claimed_by;
  const canStart = task.status === 'claimed';
  const canComplete = task.status === 'in_progress' || task.status === 'claimed';
  const needsApproval = task.status === 'pending_approval' && task.is_request;

  const canCancelNow = !!onCancel && task.status !== 'completed' && task.status !== 'cancelled';
  const canReleaseNow = !!onReleaseClaim && (task.status === 'claimed' || task.status === 'in_progress');
  const showMoreMenu = canCancelNow || canReleaseNow || !!onDelete;

  const isTerminal = task.status === 'completed' || task.status === 'cancelled';
  const overdue = !!task.due_date && !isTerminal && isPast(new Date(task.due_date));

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 border rounded-md bg-card',
          overdue && 'border-destructive/40',
        )}
      >
        <span
          className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT_COLORS[task.priority] || 'bg-gray-400')}
          title={TASK_PRIORITY_LABELS[task.priority]}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{task.title}</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
              {TASK_TYPE_LABELS[task.task_type]}
            </Badge>
            <Badge className={cn('text-[10px] h-4 px-1.5 shrink-0 text-white', TASK_STATUS_COLORS[task.status] || 'bg-gray-500')}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
            {(task.from_room || task.to_room) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {task.from_room?.room_number}
                {task.from_room && task.to_room && <ArrowRight className="h-3 w-3" />}
                {task.to_room?.room_number}
              </span>
            )}
            {task.inventory_item && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {task.inventory_item.name}
                {task.quantity > 1 ? ` ×${task.quantity}` : ''}
              </span>
            )}
            {task.requester && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.requester.full_name}
              </span>
            )}
            {task.claimer && <span>→ {task.claimer.full_name}</span>}
            {task.due_date ? (
              <span className={cn(overdue && 'text-destructive font-medium')}>
                {overdue ? 'Overdue · ' : 'Due '}
                {formatDateTime(new Date(task.due_date))}
              </span>
            ) : (
              <span>{formatDateTime(new Date(task.created_at))}</span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1.5 shrink-0">
            {needsApproval && onApprove && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => onApprove(task.id)}
                disabled={isLoading}
                aria-label={`Approve ${task.title}`}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              </Button>
            )}
            {needsApproval && onReject && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => setShowRejectDialog(true)}
                disabled={isLoading}
                aria-label={`Reject ${task.title}`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
            {canClaim && onClaim && (
              <Button size="sm" className="h-8" onClick={() => onClaim(task.id)} disabled={isLoading}>
                Claim
              </Button>
            )}
            {canStart && onStart && (
              <Button size="sm" className="h-8" onClick={() => onStart(task.id)} disabled={isLoading}>
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            {canComplete && onComplete && (
              <Button
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowCompleteDialog(true)}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Done
              </Button>
            )}
            {showMoreMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`More actions for ${task.title}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canReleaseNow && (
                    <DropdownMenuItem onClick={() => onReleaseClaim!(task.id)}>
                      Release claim
                    </DropdownMenuItem>
                  )}
                  {canCancelNow && (
                    <DropdownMenuItem onClick={() => onCancel!(task.id)} className="text-destructive">
                      Cancel Task
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Complete dialog — notes optional */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`list-completion-notes-${task.id}`}>Completion Notes (optional)</Label>
            <Textarea
              id={`list-completion-notes-${task.id}`}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add any notes about the completed task..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onComplete?.(task.id, completionNotes);
                setShowCompleteDialog(false);
                setCompletionNotes('');
              }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog — reason required */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Task Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`list-rejection-reason-${task.id}`}>Reason for rejection</Label>
            <Textarea
              id={`list-rejection-reason-${task.id}`}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this request is being rejected..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onReject?.(task.id, rejectionReason);
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={!rejectionReason.trim() || isLoading}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently delete this task? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete?.(task.id);
                setShowDeleteDialog(false);
              }}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
