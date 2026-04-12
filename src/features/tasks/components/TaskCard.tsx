/**
 * TaskCard Component
 *
 * Displays a single staff task with actions based on user role
 */

import { useState } from 'react';
import { format, formatDistanceToNow, isPast, isWithinInterval, addHours, isFuture } from 'date-fns';
import {
  Clock,
  CheckCircle,
  XCircle,
  Play,
  User,
  Package,
  MapPin,
  ArrowRight,
  AlertCircle,
  MoreVertical,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import type { StaffTask } from '@features/tasks/types/staffTasks';
import {
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS
} from '@features/tasks/types/staffTasks';

interface TaskCardProps {
  task: StaffTask;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onClaim?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onComplete?: (taskId: string, notes?: string) => void;
  onCancel?: (taskId: string) => void;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string, reason: string) => void;
  isLoading?: boolean;
}

const PRIORITY_BORDER_COLORS: Record<StaffTask['priority'], string> = {
  low: 'border-l-slate-400',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

const PRIORITY_DOT_COLORS: Record<StaffTask['priority'], string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

function DueDateDisplay({ dueDate, status }: { dueDate: string; status: StaffTask['status'] }) {
  const date = new Date(dueDate);
  const isTerminal = status === 'completed' || status === 'cancelled';
  const overdue = !isTerminal && isPast(date);
  const dueSoon = !isTerminal && !overdue && isFuture(date) && isWithinInterval(date, { start: new Date(), end: addHours(new Date(), 24) });

  if (overdue) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
        <AlertCircle className="h-3 w-3" />
        <span>Overdue · {format(date, 'MMM d, h:mm a')}</span>
      </div>
    );
  }

  if (dueSoon) {
    return (
      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
        <Calendar className="h-3 w-3" />
        <span>Due soon · {format(date, 'MMM d, h:mm a')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Calendar className="h-3 w-3" />
      <span>Due {format(date, 'MMM d, h:mm a')}</span>
    </div>
  );
}

export function TaskCard({
  task,
  variant = 'default',
  showActions = true,
  onClaim,
  onStart,
  onComplete,
  onCancel,
  onApprove,
  onReject,
  isLoading,
}: TaskCardProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleComplete = () => {
    onComplete?.(task.id, completionNotes);
    setShowCompleteDialog(false);
    setCompletionNotes('');
  };

  const handleReject = () => {
    onReject?.(task.id, rejectionReason);
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  const statusColor = TASK_STATUS_COLORS[task.status] || 'bg-gray-500';
  const borderColor = PRIORITY_BORDER_COLORS[task.priority] || 'border-l-gray-400';
  const dotColor = PRIORITY_DOT_COLORS[task.priority] || 'bg-gray-400';

  const canClaim = task.status === 'approved' && !task.claimed_by;
  const canStart = task.status === 'claimed';
  const canComplete = task.status === 'in_progress' || task.status === 'claimed';
  const needsApproval = task.status === 'pending_approval' && task.is_request;

  const hasActions = showActions && (
    (needsApproval && onApprove) ||
    (canClaim && onClaim) ||
    (canStart && onStart) ||
    (canComplete && onComplete) ||
    (onCancel && task.status !== 'completed' && task.status !== 'cancelled')
  );

  const timeAgo = formatDistanceToNow(new Date(task.created_at), { addSuffix: true });

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow border-l-4 ${borderColor} flex flex-col`}>
        <CardContent className={`flex-1 flex flex-col ${variant === 'compact' ? 'p-3' : 'p-4'}`}>
          {/* Main content area */}
          <div className="flex items-start justify-between gap-3 flex-1">
            <div className="flex-1 min-w-0">
              {/* Title with priority dot and type badge */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`shrink-0 h-2 w-2 rounded-full ${dotColor}`}
                  title={TASK_PRIORITY_LABELS[task.priority]}
                />
                <h3 className="font-medium truncate">{task.title}</h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  {TASK_TYPE_LABELS[task.task_type]}
                </Badge>
              </div>

              {/* Description */}
              {task.description && variant === 'default' && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}

              {/* Status badge */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={`${statusColor} text-white text-xs`}>
                  {TASK_STATUS_LABELS[task.status]}
                </Badge>
              </div>

              {/* Location Info */}
              {(task.from_room || task.to_room) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  {task.from_room && (
                    <span>Room {task.from_room.room_number}</span>
                  )}
                  {task.from_room && task.to_room && (
                    <ArrowRight className="h-3 w-3" />
                  )}
                  {task.to_room && (
                    <span>Room {task.to_room.room_number}</span>
                  )}
                </div>
              )}

              {/* Inventory Item */}
              {task.inventory_item && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Package className="h-3 w-3" />
                  <span>{task.inventory_item.name}</span>
                  {task.quantity > 1 && <span>(x{task.quantity})</span>}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-1">
                {task.requester && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.requester.full_name}
                  </span>
                )}
                {task.claimer && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Claimed by {task.claimer.full_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>

              {/* Due Date */}
              {task.due_date && (
                <div className="mb-1">
                  <DueDateDisplay dueDate={task.due_date} status={task.status} />
                </div>
              )}

            </div>

            {/* Approval actions and More menu (non-mobile layout) */}
            {showActions && (
              <div className="flex items-center gap-2 shrink-0">
                {needsApproval && onApprove && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => onApprove(task.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={isLoading}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* More Actions Menu */}
                {(onCancel && task.status !== 'completed' && task.status !== 'cancelled') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onCancel(task.id)}
                        className="text-destructive"
                      >
                        Cancel Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* Action buttons: full-width row at card bottom on mobile */}
          {hasActions && (canClaim || canStart || canComplete) && (
            <>
              <div className="border-t mt-3 pt-3 flex gap-2">
                {canClaim && onClaim && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onClaim(task.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Claim'}
                  </Button>
                )}

                {canStart && onStart && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onStart(task.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                )}

                {canComplete && onComplete && (
                  <>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete?.(task.id, '');
                      }}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Done
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCompleteDialog(true)}
                      disabled={isLoading}
                    >
                      Done + Notes
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Completion Notes (optional)</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the completed task..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Task Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for rejection</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
