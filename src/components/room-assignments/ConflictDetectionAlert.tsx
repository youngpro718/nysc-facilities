import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, MapPin, Calendar } from 'lucide-react';

export interface AssignmentConflict {
  type: 'primary_office' | 'room_capacity' | 'schedule_overlap' | 'duplicate_assignment';
  message: string;
  severity: 'warning' | 'error';
  details?: string;
}

interface ConflictDetectionAlertProps {
  conflicts: AssignmentConflict[];
}

export function ConflictDetectionAlert({ conflicts }: ConflictDetectionAlertProps) {
  if (conflicts.length === 0) return null;

  const getIcon = (type: AssignmentConflict['type']) => {
    switch (type) {
      case 'primary_office':
        return <MapPin className="h-4 w-4" />;
      case 'room_capacity':
        return <Users className="h-4 w-4" />;
      case 'schedule_overlap':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: AssignmentConflict['severity']) => {
    return severity === 'error' 
      ? 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
      : 'border-yellow-500/50 text-yellow-600 dark:border-yellow-500 [&>svg]:text-yellow-600';
  };

  return (
    <div className="space-y-2">
      {conflicts.map((conflict, index) => (
        <Alert key={index} className={getSeverityColor(conflict.severity)}>
          {getIcon(conflict.type)}
          <AlertDescription>
            <div className="font-medium">{conflict.message}</div>
            {conflict.details && (
              <div className="mt-1 text-sm opacity-80">{conflict.details}</div>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}