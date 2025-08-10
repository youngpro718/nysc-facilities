import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedUserSettings } from '@/components/profile/EnhancedUserSettings';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { userRole } = useRolePermissions();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">All Settings</h1>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-6">
          {userRole === 'admin' && (
            <Card className="border-primary/30">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">You are an administrator</div>
                      <p className="text-sm text-muted-foreground">Manage system-wide settings, roles, modules and policies.</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/system-settings')}>
                    Open Admin Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div>
            <h2 className="text-2xl font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete settings management for notifications, display, security, and accessibility
            </p>
          </div>
          <EnhancedUserSettings />
        </div>
      </div>
    </div>
  );
}
