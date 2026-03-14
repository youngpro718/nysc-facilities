import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { ModuleManagement } from "@/components/profile/ModuleManagement";

export default function SystemSettings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header removed — Layout provides page title */}

      {/* App Install Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">Install App on Phones</h3>
                <p className="text-sm text-muted-foreground">
                  Share QR code or link to install the app on staff phones
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/install')}
              size="sm"
              className="shrink-0"
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
