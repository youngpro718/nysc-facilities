import { User, ChevronLeft, Settings2, ArrowRight, Shield, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { EnhancedUserSettings } from "@/components/profile/EnhancedUserSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  
  // Get active tab from URL or default to 'profile'
  const activeTab = searchParams.get('tab') || 'profile';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (isMobile) {
    return (
      <div className="space-y-4 pb-24">
        {/* Header with back button */}
        <div className="flex items-center gap-3 px-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="h-11 w-11 touch-manipulation active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile & Settings</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12">
            <TabsTrigger value="profile" className="h-10 text-sm touch-manipulation">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-10 text-sm touch-manipulation">
              <Settings2 className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4 space-y-4 animate-in fade-in-50 duration-200">
            {/* Admin Navigation Hint */}
            {isAdmin && (
              <Card className="bg-muted/50 border-muted p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Looking for team management?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/admin">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin Center
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/system-settings">
                        <Settings className="h-3 w-3 mr-1" />
                        System
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            <MobileProfileHeader />
            <Card className="p-4">
              <PersonalInfoForm />
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4 animate-in fade-in-50 duration-200">
            <EnhancedUserSettings />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 md:pb-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile & Settings</h1>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground ml-12 sm:ml-0">
          Manage your account and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-2 max-w-md">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6 space-y-6">
          {/* Admin Navigation Hint */}
          {isAdmin && (
            <Card className="bg-muted/50 border-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-sm text-muted-foreground">
                    Looking for user management or system configuration?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Center
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/system-settings">
                      <Settings className="h-4 w-4 mr-2" />
                      System Settings
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          <Card className="border-0 sm:border sm:shadow-sm">
            <div className="p-4 sm:p-6">
              <ProfileHeader />
            </div>
          </Card>

          <Card className="border-0 sm:border sm:shadow-sm">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-2" id="personal-info">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Personal Information</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Update your personal details and contact information
                </p>
              </div>
              <PersonalInfoForm />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <EnhancedUserSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
