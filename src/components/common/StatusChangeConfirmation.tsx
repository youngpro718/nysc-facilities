import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  ArrowRight, 
  Clock,
  User,
  Undo2,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface StatusChange {
  field: string;
  oldValue: string;
  newValue: string;
  icon?: React.ReactNode;
}

interface ActionCompleted {
  description: string;
  icon?: React.ReactNode;
}

interface StatusChangeConfirmationProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entityType?: string; // e.g., "Order", "Issue", "Request"
  entityId?: string;
  oldStatus: string;
  newStatus: string;
  statusChanges?: StatusChange[];
  actionsCompleted?: ActionCompleted[];
  performedBy?: string;
  timestamp?: Date;
  onUndo?: () => void;
  undoEnabled?: boolean;
  undoTimeLimit?: number; // seconds
}

export function StatusChangeConfirmation({
  open,
  onClose,
  title,
  entityType = 'Item',
  entityId,
  oldStatus,
  newStatus,
  statusChanges = [],
  actionsCompleted = [],
  performedBy,
  timestamp = new Date(),
  onUndo,
  undoEnabled = false,
  undoTimeLimit = 30,
}: StatusChangeConfirmationProps) {

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('complete') || lowerStatus.includes('fulfilled')) return 'default';
    if (lowerStatus.includes('pending') || lowerStatus.includes('review')) return 'secondary';
    if (lowerStatus.includes('reject') || lowerStatus.includes('cancel')) return 'destructive';
    return 'outline';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entity Info */}
          {entityId && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{entityType}</p>
                    <p className="text-lg font-semibold">#{entityId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(timestamp, 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Change */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              Status Change
            </h3>
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Badge variant={getStatusColor(oldStatus)} className="text-base px-4 py-1">
                {oldStatus}
              </Badge>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <Badge variant={getStatusColor(newStatus)} className="text-base px-4 py-1">
                {newStatus}
              </Badge>
            </div>
          </div>

          {/* Additional Changes */}
          {statusChanges.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Changes Made</h3>
                <div className="space-y-2">
                  {statusChanges.map((change, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        {change.icon}
                        <span className="text-sm font-medium">{change.field}:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{change.oldValue}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{change.newValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions Completed */}
          {actionsCompleted.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Actions Completed</h3>
                <div className="space-y-2">
                  {actionsCompleted.map((action, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {action.icon}
                      <span>{action.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Performed By */}
          {performedBy && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Performed by: <span className="font-medium text-foreground">{performedBy}</span></span>
              </div>
            </>
          )}

          {/* Undo Warning */}
          {undoEnabled && onUndo && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Undo2 className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      You can undo this change
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      You have {undoTimeLimit} seconds to undo this status change if needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {undoEnabled && onUndo && (
              <Button
                variant="outline"
                onClick={() => {
                  onUndo();
                  onClose();
                }}
                className="flex-1"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo Change
              </Button>
            )}
            <Button
              onClick={onClose}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {undoEnabled ? 'Confirm' : 'Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact version for inline confirmations
export function StatusChangeToast({
  oldStatus,
  newStatus,
  entityType = 'Item',
  entityId,
  onUndo,
}: Pick<StatusChangeConfirmationProps, 'oldStatus' | 'newStatus' | 'entityType' | 'entityId' | 'onUndo'>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm">
          {entityType} {entityId && `#${entityId}`} status changed
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {oldStatus}
        </Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="default" className="text-xs">
          {newStatus}
        </Badge>
      </div>
      {onUndo && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          className="h-7 px-2"
        >
          <Undo2 className="h-3 w-3 mr-1" />
          Undo
        </Button>
      )}
    </div>
  );
}
