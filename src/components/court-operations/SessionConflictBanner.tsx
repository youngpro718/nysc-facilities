import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { ConflictDetectionResult } from '@/services/court/conflictDetectionService';

interface SessionConflictBannerProps {
  conflicts: ConflictDetectionResult;
  onViewDetails?: () => void;
}

export function SessionConflictBanner({ conflicts, onViewDetails }: SessionConflictBannerProps) {
  if (!conflicts.hasConflicts && conflicts.warnings.length === 0) {
    return null;
  }

  const criticalCount = conflicts.summary.criticalConflicts;
  const warningCount = conflicts.summary.warnings;
  const totalIssues = conflicts.summary.totalConflicts + warningCount;

  return (
    <Alert variant={criticalCount > 0 ? 'destructive' : 'default'} className="mb-4">
      <div className="flex items-start gap-3">
        {criticalCount > 0 ? (
          <AlertTriangle className="h-5 w-5 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 mt-0.5" />
        )}
        
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2">
            {criticalCount > 0 ? 'Critical Conflicts Detected' : 'Warnings Detected'}
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} Critical
                </Badge>
              )}
              {conflicts.summary.totalConflicts - criticalCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {conflicts.summary.totalConflicts - criticalCount} Conflicts
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {warningCount} Warnings
                </Badge>
              )}
            </div>
          </AlertTitle>
          
          <AlertDescription className="mt-2">
            <div className="space-y-1">
              {conflicts.conflicts.slice(0, 2).map((conflict) => (
                <div key={conflict.id} className="text-sm">
                  • {conflict.title}: {conflict.description}
                </div>
              ))}
              {conflicts.warnings.slice(0, 2).map((warning) => (
                <div key={warning.id} className="text-sm">
                  • {warning.title}: {warning.description}
                </div>
              ))}
              {totalIssues > 2 && (
                <div className="text-sm text-muted-foreground">
                  ... and {totalIssues - 2} more issue{totalIssues - 2 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </AlertDescription>
        </div>

        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="ml-auto"
          >
            View Details
          </Button>
        )}
      </div>
    </Alert>
  );
}
