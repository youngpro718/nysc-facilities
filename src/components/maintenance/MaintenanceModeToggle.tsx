import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { 
  Settings, 
  AlertTriangle, 
  Shield, 
  Clock, 
  User, 
  Wrench,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function MaintenanceModeToggle() {
  const {
    isMaintenanceMode,
    maintenanceSettings,
    enableMaintenanceMode,
    disableMaintenanceMode,
    getMaintenanceInfo
  } = useMaintenanceMode();

  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = () => {
    if (isMaintenanceMode) {
      disableMaintenanceMode();
      setShowConfirm(false);
    } else {
      if (!showConfirm) {
        setShowConfirm(true);
        return;
      }
      enableMaintenanceMode(reason || 'System maintenance');
      setShowConfirm(false);
      setReason('');
    }
  };

  const maintenanceInfo = getMaintenanceInfo();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Maintenance Mode
          {isMaintenanceMode && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              ACTIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isMaintenanceMode ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <div>
              <div className="font-medium">
                {isMaintenanceMode ? 'Maintenance Mode Active' : 'Normal Operation'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isMaintenanceMode 
                  ? 'One-click admin access enabled for all users'
                  : 'Standard authentication required'
                }
              </div>
            </div>
          </div>
          <Switch
            checked={isMaintenanceMode}
            onCheckedChange={handleToggle}
            disabled={showConfirm}
          />
        </div>

        {/* Maintenance Info */}
        {isMaintenanceMode && maintenanceInfo.enabledAt && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>Enabled:</strong> {new Date(maintenanceInfo.enabledAt).toLocaleString()}</div>
                <div><strong>By:</strong> {maintenanceInfo.enabledBy}</div>
                {maintenanceInfo.reason && (
                  <div><strong>Reason:</strong> {maintenanceInfo.reason}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Confirmation Panel */}
        {showConfirm && !isMaintenanceMode && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-4">
                <div>
                  <strong>Warning:</strong> Enabling maintenance mode will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Bypass all authentication requirements</li>
                    <li>Grant full admin access to all users</li>
                    <li>Allow access to all buildings and data</li>
                    <li>Disable normal security restrictions</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for maintenance mode:</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., System maintenance, Testing, Demo"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleToggle}
                    variant="destructive"
                    size="sm"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Enable Maintenance Mode
                  </Button>
                  <Button 
                    onClick={() => setShowConfirm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Feature Description */}
        <div className="space-y-4">
          <h3 className="font-semibold">What is Maintenance Mode?</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Maintenance mode provides a one-click admin access feature for system maintenance, 
              testing, or demonstrations. When enabled:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Users can bypass the login screen with a single click</li>
              <li>All users get full administrator privileges</li>
              <li>Access to all buildings, rooms, and system functions</li>
              <li>All security restrictions are temporarily disabled</li>
              <li>Perfect for demos, testing, or system maintenance</li>
            </ul>
            <p className="text-amber-600 font-medium">
              ⚠️ Only use this feature in controlled environments or for authorized maintenance.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        {isMaintenanceMode && (
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/admin'}
              variant="outline"
              size="sm"
            >
              <User className="h-4 w-4 mr-2" />
              Go to Admin Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = '/operations'}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Operations Overview
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
