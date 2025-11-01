import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History, User, MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AssignmentHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'expired' | 'renewed';
  timestamp: string;
  changed_by: string;
  changes: {
    field: string;
    old_value?: string;
    new_value?: string;
  }[];
  notes?: string;
}

interface AssignmentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  occupantName: string;
  roomNumber: string;
  history: AssignmentHistoryEntry[];
}

export function AssignmentHistoryDialog({
  isOpen,
  onClose,
  assignmentId,
  occupantName,
  roomNumber,
  history
}: AssignmentHistoryDialogProps) {
  const getActionBadge = (action: AssignmentHistoryEntry['action']) => {
    const variants = {
      created: { variant: 'default' as const, color: 'bg-green-500' },
      updated: { variant: 'secondary' as const, color: 'bg-blue-500' },
      deleted: { variant: 'destructive' as const, color: 'bg-red-500' },
      expired: { variant: 'outline' as const, color: 'bg-yellow-500' },
      renewed: { variant: 'default' as const, color: 'bg-purple-500' }
    };
    
    const config = variants[action];
    
    return (
      <Badge variant={config.variant} className="capitalize">
        {action}
      </Badge>
    );
  };

  const formatFieldName = (field: string) => {
    return field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {occupantName}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Room {roomNumber}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history available for this assignment.</p>
              </div>
            ) : (
              history.map((entry, index) => (
                <div key={entry.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getActionBadge(entry.action)}
                      <span className="text-sm font-medium">
                        {entry.changed_by}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>

                  {entry.changes.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {entry.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="text-sm">
                          <span className="font-medium text-muted-foreground">
                            {formatFieldName(change.field)}:
                          </span>
                          {change.old_value && change.new_value ? (
                            <span className="ml-2">
                              <span className="text-red-600 line-through">
                                {change.old_value}
                              </span>
                              {' → '}
                              <span className="text-green-600">
                                {change.new_value}
                              </span>
                            </span>
                          ) : change.new_value ? (
                            <span className="ml-2 text-green-600">
                              {change.new_value}
                            </span>
                          ) : change.old_value ? (
                            <span className="ml-2 text-red-600 line-through">
                              {change.old_value}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.notes && (
                    <div className="ml-6 text-sm text-muted-foreground italic">
                      "{entry.notes}"
                    </div>
                  )}

                  {index < history.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}