import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  AlertTriangle, 
  Shield, 
  Building, 
  Settings,
  Users,
  BarChart3,
  Key
} from 'lucide-react';

interface MaintenanceLoginProps {
  onMaintenanceLogin: () => void;
}

export function MaintenanceLogin({ onMaintenanceLogin }: MaintenanceLoginProps) {
  const { isMaintenanceMode, getMaintenanceInfo } = useMaintenanceMode();
  const navigate = useNavigate();

  if (!isMaintenanceMode) {
    return null;
  }

  const maintenanceInfo = getMaintenanceInfo();

  const handleMaintenanceLogin = () => {
    onMaintenanceLogin();
    // Navigate to admin dashboard by default
    navigate('/admin');
  };

  const quickActions = [
    {
      icon: Building,
      label: 'Operations Overview',
      description: 'View all buildings and room status',
      path: '/operations'
    },
    {
      icon: Settings,
      label: 'Admin Dashboard',
      description: 'Full administrative controls',
      path: '/admin'
    },
    {
      icon: Users,
      label: 'User Management',
      description: 'Manage users and permissions',
      path: '/admin#management'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'System reports and analytics',
      path: '/admin#analytics'
    },
    {
      icon: Key,
      label: 'Security Settings',
      description: 'Security and access controls',
      path: '/admin#security'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Maintenance Mode Banner */}
        <Alert variant="destructive" className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Maintenance Mode Active</strong> - One-click admin access enabled
              </div>
              <Badge variant="destructive">
                <Wrench className="h-3 w-3 mr-1" />
                MAINTENANCE
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Main Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">NYSC Facilities Hub</CardTitle>
            <p className="text-muted-foreground">Maintenance Mode Access</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Maintenance Info */}
            {maintenanceInfo.enabledAt && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="text-sm">
                  <strong>Enabled:</strong> {new Date(maintenanceInfo.enabledAt).toLocaleString()}
                </div>
                {maintenanceInfo.reason && (
                  <div className="text-sm">
                    <strong>Reason:</strong> {maintenanceInfo.reason}
                  </div>
                )}
              </div>
            )}

            {/* One-Click Access Button */}
            <div className="text-center space-y-4">
              <Button 
                onClick={handleMaintenanceLogin}
                size="lg"
                className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700"
              >
                <Shield className="h-5 w-5 mr-2" />
                Enter as Administrator
              </Button>
              <p className="text-sm text-muted-foreground">
                Click to access the system with full administrative privileges
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-4">
              <h3 className="font-semibold text-center">Quick Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => {
                      onMaintenanceLogin();
                      navigate(action.path);
                    }}
                  >
                    <action.icon className="h-5 w-5 mr-3 text-orange-600" />
                    <div className="text-left">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Capabilities List */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Full Access Includes:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• View and manage all buildings and rooms</li>
                <li>• Access to all user accounts and permissions</li>
                <li>• Complete system configuration and settings</li>
                <li>• All reports, analytics, and audit logs</li>
                <li>• Security management and rate limit controls</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>NYSC Facilities Management System - Maintenance Mode</p>
          <p>For authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}
