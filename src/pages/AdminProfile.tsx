import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, FileText, ChevronLeft, Settings, Activity, UserCheck, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ReportsSection } from "@/components/profile/reports/ReportsSection";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { MobileAdminDashboard } from "@/components/profile/mobile/MobileAdminDashboard";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { MobileSettingsCard } from "@/components/profile/mobile/MobileSettingsCard";
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

  const systemSettings = [
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose your preferred theme',
      icon: LayoutGrid,
      type: 'selection' as const,
      value: 'System',
      action: () => navigate('/settings/theme')
    },
    {
      id: 'notifications',
      title: 'Admin Notifications',
      description: 'Receive system alerts and updates',
      icon: Activity,
      type: 'toggle' as const,
      value: true,
      onChange: (value: boolean) => {
        // TODO: Implement notification settings update with Supabase
        console.log('Admin notifications:', value);
        // This would update user preferences in the database
      }
    },
    {
      id: 'maintenance',
      title: 'Maintenance Mode',
      description: 'Enable system maintenance mode',
      icon: Settings,
      type: 'toggle' as const,
      value: false,
      onChange: (value: boolean) => {
        // TODO: Implement maintenance mode toggle with system-wide effect
        console.log('Maintenance mode:', value);
        // This would set a global maintenance flag affecting all users
      }
    }
  ];

  const securitySettings = [
    {
      id: 'two-factor',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      icon: Shield,
      type: 'navigation' as const,
      badge: 'Recommended',
      action: () => navigate('/settings/security/2fa')
    },
    {
      id: 'session-timeout',
      title: 'Session Timeout',
      description: 'Automatically log out after inactivity',
      icon: Shield,
      type: 'selection' as const,
      value: '30 minutes',
      action: () => navigate('/settings/security/session')
    }
  ];

  if (isMobile) {
    return (
      <div className="space-y-4 pb-20">
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
        <MobileAdminDashboard />
        
        <MobileSettingsCard
          title="System Settings"
          description="Configure system-wide settings"
          settings={systemSettings}
        />
        
        <MobileSettingsCard
          title="Security Settings"
          description="Manage security and authentication"
          settings={securitySettings}
        />
      </div>
    );
  }

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

      <MobileProfileHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="w-full min-w-max flex h-auto p-1 bg-muted rounded-lg">
            <TabsTrigger value="overview" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Overview
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
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
          <MobileAdminDashboard />
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
      </Tabs>
    </div>
  );
}
