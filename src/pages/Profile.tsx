
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, ChevronLeft, Bell, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { MobileSettingsCard } from "@/components/profile/mobile/MobileSettingsCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkUserRole();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsAdmin(roleData?.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const notificationSettings = [
    {
      id: 'email-notifications',
      title: 'Email Notifications',
      description: 'Receive updates via email',
      icon: Bell,
      type: 'toggle' as const,
      value: true,
      onChange: (value: boolean) => console.log('Email notifications:', value)
    },
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      description: 'Receive push notifications on mobile',
      icon: Bell,
      type: 'toggle' as const,
      value: false,
      onChange: (value: boolean) => console.log('Push notifications:', value)
    }
  ];

  const accountSettings = [
    {
      id: 'edit-profile',
      title: 'Edit Personal Information',
      description: 'Update your name, email, and contact details',
      icon: User,
      type: 'navigation' as const,
      action: () => {}
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Control your privacy and data sharing',
      icon: Shield,
      type: 'navigation' as const,
      action: () => {}
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
        
        <MobileSettingsCard
          title="Account Settings"
          description="Manage your personal information"
          settings={accountSettings}
        />
        
        <MobileSettingsCard
          title="Notifications"
          description="Configure your notification preferences"
          settings={notificationSettings}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
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
      
      <Tabs defaultValue="profile" className="w-full space-y-6 sm:space-y-8">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="grid w-full min-w-max grid-cols-2 gap-1 bg-muted p-1 h-auto">
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 px-4 py-3 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-colors whitespace-nowrap"
            >
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center gap-2 px-4 py-3 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground transition-colors whitespace-nowrap"
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="profile" className="space-y-4 sm:space-y-6 mt-6">
          <Card className="border-0 sm:border sm:shadow-sm">
            <div className="p-4 sm:p-6">
              <ProfileHeader />
            </div>
          </Card>
          
          <Card className="border-0 sm:border sm:shadow-sm">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Personal Information</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Update your personal details and contact information
                </p>
              </div>
              <PersonalInfoForm />
            </div>
          </Card>

          <Card className="border-0 sm:border sm:shadow-sm">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Notification Settings</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Choose how you want to receive notifications
                </p>
              </div>
              <NotificationPreferences />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
