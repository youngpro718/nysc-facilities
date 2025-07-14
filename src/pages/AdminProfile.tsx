import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, FileText, ChevronLeft, Settings, Activity, UserCheck, LayoutGrid, Palette, Cog, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ReportsSection } from "@/components/profile/reports/ReportsSection";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { AppearanceSettings } from "@/components/profile/AppearanceSettings";
import { AdminDashboardCustomization } from "@/components/profile/AdminDashboardCustomization";
import { AdminSystemSettings } from "@/components/profile/AdminSystemSettings";
import { DynamicAdminDashboard } from "@/components/profile/admin/DynamicAdminDashboard";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { MobileSettingsCard } from "@/components/profile/mobile/MobileSettingsCard";
import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard";
import { useState, useEffect } from "react";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleTabSwitch = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('switchToTab', handleTabSwitch as EventListener);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('switchToTab', handleTabSwitch as EventListener);
    };
  }, []);

  // Remove the broken navigation settings and use modals instead
  // These functions are now handled by the MobileAdminDashboard modals

  // Remove the broken security navigation - handled by modals now

  if (isMobile) {
    return (
      <div className="space-y-4 pb-nav-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Admin Profile</h1>
        </div>

        <MobileProfileHeader />
        <DynamicAdminDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-nav-safe">
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

      <MobileProfileHeader />

       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto scrollbar-hide relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-full bg-gradient-to-r from-muted to-transparent pointer-events-none z-10 rounded-l-lg" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-gradient-to-l from-muted to-transparent pointer-events-none z-10 rounded-r-lg" />
          <TabsList className="w-full min-w-max flex h-auto p-1 bg-muted rounded-lg">
            <TabsTrigger value="overview" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="system" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Cog className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              System
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
            <TabsTrigger value="monitoring" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
          <DynamicAdminDashboard />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 sm:space-y-6 mt-4">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-4">
          <AdminDashboardCustomization />
        </TabsContent>

        <TabsContent value="system" className="space-y-4 sm:space-y-6 mt-4">
          <AdminSystemSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-4 sm:space-y-6 mt-4">
          <Card className="p-4 sm:p-6">
            <SecuritySection />
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4 sm:space-y-6 mt-4">
          <Card className="p-4 sm:p-6">
            <DatabaseSection />
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 sm:space-y-6 mt-4">
          <Card className="p-4 sm:p-6">
            <ReportsSection />
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4 sm:space-y-6 mt-4">
          <MonitoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
