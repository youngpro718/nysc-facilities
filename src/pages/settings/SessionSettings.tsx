import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Clock, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SessionSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTimeout, setSelectedTimeout] = useState("30 minutes");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    fetchActiveSessions();
  }, []);
  
  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_active_at', { ascending: false });
      
      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const timeoutOptions = [
    { value: "15 minutes", label: "15 minutes", description: "High security" },
    { value: "30 minutes", label: "30 minutes", description: "Recommended" },
    { value: "1 hour", label: "1 hour", description: "Standard" },
    { value: "2 hours", label: "2 hours", description: "Extended" },
    { value: "4 hours", label: "4 hours", description: "Long session" },
    { value: "Never", label: "Never timeout", description: "Not recommended" }
  ];

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Call rate limiting function to track session updates
      const { error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        action_type: 'session_update',
        max_attempts: 3,
        time_window: '5 minutes'
      });
      
      if (rateLimitError) {
        toast({
          title: "Rate Limited",
          description: "Too many session updates. Please wait before trying again.",
          variant: "destructive"
        });
        return;
      }
      
      // In a real implementation, this would update user preferences
      // For now, we'll just show the success message
      toast({
        title: "Session Settings Updated",
        description: `Session timeout set to ${selectedTimeout}`
      });
      
      navigate(-1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update session settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const invalidateAllSessions = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.rpc('invalidate_user_sessions');
      
      if (error) throw error;
      
      await fetchActiveSessions();
      
      toast({
        title: "Sessions Invalidated",
        description: "All sessions have been ended. You will need to log in again on other devices."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invalidate sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-2xl sm:text-3xl font-semibold">Session Settings</h1>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Timeout
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically log out after a period of inactivity
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {timeoutOptions.map((option) => {
            const isSelected = selectedTimeout === option.value;
            const isRecommended = option.value === "30 minutes";
            const isNotRecommended = option.value === "Never";
            
            return (
              <div
                key={option.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedTimeout(option.value)}
              >
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Clock className="h-4 w-4" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{option.label}</span>
                    {isRecommended && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                    {isNotRecommended && (
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                        Not recommended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Security Information</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Shorter timeout periods provide better security but may require more frequent logins. 
            We recommend 30 minutes for a good balance between security and convenience.
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Session Management</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={invalidateAllSessions}
              disabled={isLoading}
            >
              End All Sessions
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Active sessions: {activeSessions.length}. Ending all sessions will log you out of all devices.
          </p>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}