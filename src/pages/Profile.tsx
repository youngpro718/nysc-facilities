
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Database, FileText, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { ReportsSection } from "@/components/profile/ReportsSection";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10 px-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full space-y-8">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-background p-1">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger 
              value="security" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger 
              value="database" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            Reports
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

        {isAdmin && (
          <TabsContent value="security">
            <SecuritySection />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="database">
            <DatabaseSection />
          </TabsContent>
        )}

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
