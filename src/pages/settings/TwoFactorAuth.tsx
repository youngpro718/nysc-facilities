import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Shield, Smartphone, Key, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleToggle = (enabled: boolean) => {
    if (enabled && !isEnabled) {
      setShowSetup(true);
    } else if (!enabled && isEnabled) {
      // Disable 2FA
      setIsEnabled(false);
      setShowSetup(false);
      toast({
        title: "Two-Factor Authentication Disabled",
        description: "Your account is now using single-factor authentication."
      });
    }
  };

  const handleSetupComplete = () => {
    setIsEnabled(true);
    setShowSetup(false);
    toast({
      title: "Two-Factor Authentication Enabled",
      description: "Your account is now protected with 2FA."
    });
  };

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
        <h1 className="text-2xl sm:text-3xl font-semibold">Two-Factor Authentication</h1>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
              <Badge variant="secondary">Recommended</Badge>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {isEnabled && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">2FA is enabled</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Your account is protected with two-factor authentication
            </p>
          </div>
        )}

        {showSetup && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <h3 className="font-semibold">Setup Two-Factor Authentication</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Authenticator App</div>
                  <div className="text-xs text-muted-foreground">
                    Use Google Authenticator, Authy, or similar app
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Setup
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                <Key className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Hardware Key</div>
                  <div className="text-xs text-muted-foreground">
                    Use a physical security key (Coming soon)
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Setup
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSetupComplete} size="sm">
                Complete Setup
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSetup(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}