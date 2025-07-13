
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

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
