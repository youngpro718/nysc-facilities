import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, FileText, ChevronLeft, Settings, Activity, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ReportsSection } from "@/components/profile/reports/ReportsSection";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { AdminProfileHeader } from "@/components/profile/admin/components/ProfileHeader";
import { SystemSettingsSection } from "@/components/profile/sections/SystemSettingsSection";
import { ActivityLogsSection } from "@/components/profile/sections/ActivityLogsSection";
import { VerificationSection } from "@/components/profile/sections/VerificationSection";

export default function AdminProfile() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Admin Profile</h1>
      </div>

      <AdminProfileHeader />

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="verification">
            <UserCheck className="h-4 w-4 mr-2" />
            Verification
          </TabsTrigger>
        </TabsList>

        <Card>
          <TabsContent value="settings" className="space-y-6">
            <SystemSettingsSection />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySection />
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <DatabaseSection />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsSection />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityLogsSection />
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <VerificationSection />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
