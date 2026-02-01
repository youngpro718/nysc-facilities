import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ModuleManagement } from "@/components/profile/ModuleManagement";

export default function SystemSettings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-nav-safe px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-semibold">System Settings</h1>
        </div>
      </div>

      {/* App Install Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Install App on Phones</h3>
                <p className="text-sm text-muted-foreground">
                  Share QR code or link to install the app on staff phones
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/install')}
              size="sm"
            >
              View QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Module Management</CardTitle>
          <CardDescription>
            Enable or disable features across the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleManagement />
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Database Management</CardTitle>
          <CardDescription>
            Export data, create backups, and manage database operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseSection />
        </CardContent>
      </Card>
    </div>
  );
}
