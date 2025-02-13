
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
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full space-y-8">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 bg-background p-1">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6">
            <ProfileHeader />
          </Card>
          
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Personal Information</h2>
                <p className="text-muted-foreground mt-2">
                  Update your personal details and contact information
                </p>
              </div>
              <PersonalInfoForm />
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Notification Settings</h2>
                <p className="text-muted-foreground mt-2">
                  Choose how you want to receive notifications
                </p>
              </div>
              <NotificationPreferences />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
