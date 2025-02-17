
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, FileText, ChevronLeft, Settings, Activity, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ReportsSection } from "@/components/profile/ReportsSection";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { AdminProfileHeader } from "@/components/profile/sections/AdminProfileHeader";
import { SystemSettingsSection } from "@/components/profile/sections/SystemSettingsSection";
import { ActivityLogsSection } from "@/components/profile/sections/ActivityLogsSection";
import { VerificationSection } from "@/components/profile/sections/VerificationSection";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData?.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage system-wide settings and configurations
        </p>
      </div>

      <div className="mb-8">
        <AdminProfileHeader />
      </div>
      
      <Tabs defaultValue="security" className="w-full space-y-8">
        <TabsList className="grid w-full grid-cols-6 gap-4 bg-background p-1">
          <TabsTrigger 
            value="security" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="verifications" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            Verifications
          </TabsTrigger>
          <TabsTrigger 
            value="database" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <SecuritySection isAdmin={true} />
        </TabsContent>

        <TabsContent value="verifications">
          <VerificationSection />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseSection />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettingsSection />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
