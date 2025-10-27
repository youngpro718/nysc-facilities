import { User, Shield, ChevronLeft, Bell, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Profile() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // No tab state; page is sectioned

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };


  const notificationSettings = [
    {
      id: 'manage-notifications',
      title: 'Manage Notifications',
      description: 'Configure email and desktop alerts in Settings',
      icon: Bell,
      type: 'navigation' as const,
      action: () => navigate('/settings?tab=notifications')
    }
  ];

  if (isMobile) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Profile</h1>
        </div>
        
        <MobileProfileHeader />
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <p className="text-sm text-muted-foreground">Manage your settings</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/settings')}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              All Settings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/settings?tab=notifications')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notification Preferences
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 md:pb-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile Settings</h1>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground ml-12 sm:ml-0">
          Manage your account settings and preferences
        </p>
      </div>

      <Card className="border-0 sm:border sm:shadow-sm">
        <div className="p-4 sm:p-6">
          <ProfileHeader />
        </div>
      </Card>

      <Card className="border-0 sm:border sm:shadow-sm">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-2" id="personal-info">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Personal Information</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Update your personal details and contact information
            </p>
          </div>
          <PersonalInfoForm />
        </div>
      </Card>

    </div>
  );
}
