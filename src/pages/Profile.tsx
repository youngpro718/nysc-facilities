
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Database, FileText, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { ReportsSection } from "@/components/profile/ReportsSection";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";

export default function Profile() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Tabs defaultValue="profile" className="w-full space-y-8">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 gap-4 bg-background p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="p-6 space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
              <ProfileHeader />
              <div className="space-y-6">
                <PersonalInfoForm />
              </div>
              <div className="space-y-6">
                <NotificationPreferences />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseSection />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
