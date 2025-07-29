import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedUserSettings } from '@/components/profile/EnhancedUserSettings';

export default function SettingsPage() {
  const navigate = useNavigate();

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
          <div>
            <h2 className="text-2xl font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete settings management for notifications, privacy, appearance, language, security, and accessibility
            </p>
          </div>
          <EnhancedUserSettings />
        </div>
      </div>
    </div>
  );
}
