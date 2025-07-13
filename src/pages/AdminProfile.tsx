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
    <div className="space-y-4 sm:space-y-6 pb-20">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold">Admin Profile</h1>
      </div>

      <AdminProfileHeader />

      <Tabs defaultValue="settings" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="w-full min-w-max flex h-auto p-1 bg-muted rounded-lg">
            <TabsTrigger value="settings" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="database" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Verification
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="border-0 sm:border sm:shadow-sm">
          <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4 p-4 sm:p-6">
            <SystemSettingsSection />
          </TabsContent>

          <TabsContent value="security" className="space-y-4 sm:space-y-6 mt-4 p-4 sm:p-6">
            <SecuritySection />
          </TabsContent>

          <TabsContent value="database" className="space-y-4 sm:space-y-6 mt-4 p-4 sm:p-6">
            <DatabaseSection />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 sm:space-y-6 mt-4 p-4 sm:p-6">
            <ReportsSection />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 sm:space-y-6 mt-4 p-4 sm:p-6">
            <ActivityLogsSection />
          </TabsContent>

          <TabsContent value="verification" className="space-y-4 sm:space-y-6 mt-4 p-4 sm:p-6">
            <VerificationSection />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
