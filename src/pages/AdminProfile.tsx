
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, FileText, ChevronLeft, Settings, Activity, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ReportsSection } from "@/components/profile/reports/ReportsSection";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { AdminProfileHeader } from "@/components/profile/sections/AdminProfileHeader";
import { SystemSettingsSection } from "@/components/profile/sections/SystemSettingsSection";
import { ActivityLogsSection } from "@/components/profile/sections/ActivityLogsSection";
import { VerificationSection } from "@/components/profile/sections/VerificationSection";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("security");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (roleData?.role !== 'admin') {
        toast.error("You don't have access to this section");
        navigate('/dashboard');
        return;
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setError("Failed to verify admin access. Please try again.");
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg max-w-lg mx-auto">
          <p>{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage system-wide settings and configurations
              </p>
            </div>
          </div>
        </div>

        <AdminProfileHeader />
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full space-y-8"
      >
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 h-auto sm:h-10 p-1 gap-2 sm:gap-4 bg-background">
            <TabsTrigger 
              value="security" 
              className="flex-1 sm:flex-none items-center gap-2 h-12 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Sec</span>
            </TabsTrigger>
            <TabsTrigger 
              value="verifications" 
              className="flex-1 sm:flex-none items-center gap-2 h-12 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Verifications</span>
              <span className="sm:hidden">Ver</span>
            </TabsTrigger>
            <TabsTrigger 
              value="database" 
              className="flex-1 sm:flex-none items-center gap-2 h-12 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Database</span>
              <span className="sm:hidden">DB</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex-1 sm:flex-none items-center gap-2 h-12 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
              <span className="sm:hidden">Rep</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-1 sm:flex-none items-center gap-2 h-12 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Set</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="flex-1 sm:flex-none items-center gap-2 h-12 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
              <span className="sm:hidden">Act</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="security" className="space-y-4 mt-4">
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
