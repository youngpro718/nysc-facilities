import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { Wrench, AlertTriangle } from 'lucide-react';

interface MaintenanceModeIndicatorProps {
  variant?: 'badge' | 'alert' | 'compact';
  className?: string;
}

export function MaintenanceModeIndicator({ 
  variant = 'badge', 
  className = '' 
}: MaintenanceModeIndicatorProps) {
  const { isMaintenanceMode, getMaintenanceInfo } = useMaintenanceMode();

  if (!isMaintenanceMode) {
    return null;
  }

  const maintenanceInfo = getMaintenanceInfo();

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={`border-orange-200 bg-orange-50 ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>Maintenance Mode Active</strong> - One-click admin access enabled
              {maintenanceInfo.reason && (
                <div className="text-sm mt-1">Reason: {maintenanceInfo.reason}</div>
              )}
            </div>
            <Badge variant="destructive">
              <Wrench className="h-3 w-3 mr-1" />
              MAINTENANCE
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-orange-600 ${className}`}>
        <Wrench className="h-4 w-4" />
        <span className="text-sm font-medium">Maintenance Mode</span>
      </div>
    );
  }

  // Default badge variant
  return (
    <Badge variant="destructive" className={`${className}`}>
      <Wrench className="h-3 w-3 mr-1" />
      MAINTENANCE MODE
    </Badge>
  );
}
