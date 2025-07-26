import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, LayoutGrid, User, Users, BarChart3, Settings, Shield, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicAdminDashboard } from "@/components/profile/admin/DynamicAdminDashboard";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { RoleManagement } from "@/components/profile/RoleManagement";
import { DashboardCustomization } from "@/components/profile/DashboardCustomization";
import { useState, useEffect } from "react";

// New reorganized components
import { AdminProfileSettings } from "@/components/profile/reorganized/AdminProfileSettings";
import { AdminManagementTab } from "@/components/profile/reorganized/AdminManagementTab";
import { AdminAnalyticsTab } from "@/components/profile/reorganized/AdminAnalyticsTab";

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
    
    // Handle URL hash routing
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove the #
      if (hash === 'management') {
        setActiveTab('users');
      } else if (hash === 'settings') {
        setActiveTab('personal');
      } else if (hash === 'analytics') {
        setActiveTab('analytics');
      } else if (hash === 'overview' || hash === '') {
        setActiveTab('overview');
      }
    };
    
    // Set initial tab based on hash
    handleHashChange();
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('switchToTab', handleTabSwitch as EventListener);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('hashchange', handleHashChange);
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

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Update URL hash when tab changes
          if (value === 'users') {
            window.history.replaceState(null, '', '#management');
          } else if (value === 'personal') {
            window.history.replaceState(null, '', '#settings');
          } else if (value === 'analytics') {
            window.history.replaceState(null, '', '#analytics');
          } else {
            window.history.replaceState(null, '', '#overview');
          }
        }} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto scrollbar-hide relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-full bg-gradient-to-r from-muted to-transparent pointer-events-none z-10 rounded-l-lg" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-gradient-to-l from-muted to-transparent pointer-events-none z-10 rounded-r-lg" />
          <TabsList className="w-full min-w-max flex h-auto p-1 bg-muted rounded-lg">
            <TabsTrigger value="overview" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm whitespace-nowrap">
              <LayoutGrid className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm whitespace-nowrap">
              <User className="h-4 w-4" />
              Personal Settings
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm whitespace-nowrap">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 min-w-fit flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm whitespace-nowrap">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Admin Overview</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your personal admin dashboard and quick actions
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/system-settings')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                System Settings
              </Button>
            </div>
            <DynamicAdminDashboard />
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4 sm:space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Personal Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your personal preferences, appearance, and dashboard
              </p>
            </div>
            <AdminProfileSettings />
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Dashboard Customization</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize your dashboard layout, widgets, and appearance
                </p>
              </div>
              <DashboardCustomization />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 sm:space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage users, roles, permissions, and security settings
              </p>
            </div>
            <AdminManagementTab />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Analytics & Reports</h2>
              <p className="text-sm text-muted-foreground mt-1">
                System monitoring, reports, and performance analytics
              </p>
            </div>
            <AdminAnalyticsTab />
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
}
