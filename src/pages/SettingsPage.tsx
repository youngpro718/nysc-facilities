import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedUserSettings } from '@/components/profile/EnhancedUserSettings';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { AdminQuickActions } from '@/components/settings/AdminQuickActions';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';

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
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">All Settings</h1>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-6">
          <SettingsNavigation />
          
          {userRole === 'admin' && (
            <AdminQuickActions />
          )}
          
          <div>
            <h2 className="text-2xl font-semibold">Personal Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Customize your experience, notifications, display, security, and accessibility
            </p>
          </div>
          <EnhancedUserSettings />
        </div>
      </div>
    </div>
  );
}
