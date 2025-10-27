import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SettingsStatus {
  profileData: any;
  notificationPreferences: any;
  userRole: string | null;
  errors: string[];
}

export function SettingsVerification() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<SettingsStatus>({
    profileData: null,
    notificationPreferences: null,
    userRole: null,
    errors: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      verifySettings();
    }
  }, [user]);

  const verifySettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const errors: string[] = [];
    
    try {
      // Check profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        errors.push(`Profile error: ${profileError.message}`);
      }

      setStatus({
        profileData,
        notificationPreferences: profileData?.notification_preferences,
        userRole: profileData?.role || null,
        errors
      });

    } catch (error) {
      console.error('Settings verification error:', error);
      errors.push(`Verification error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };



  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Settings Verification
            </CardTitle>
            <CardDescription>
              Verify that all profile and settings data is properly configured
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={verifySettings}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!status.profileData)}
              <span className="font-medium">Profile Data</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {status.profileData ? 'Loaded' : 'Missing'}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!status.profileData?.first_name && !!status.profileData?.last_name)}
              <span className="font-medium">Full Name</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {status.profileData?.first_name && status.profileData?.last_name 
                ? `${status.profileData.first_name} ${status.profileData.last_name}`
                : 'Incomplete'
              }
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!status.profileData?.department)}
              <span className="font-medium">Department</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {status.profileData?.department || 'Not set'}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!status.userRole)}
              <span className="font-medium">User Role</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {status.userRole || 'Not assigned'}
              </span>
              {status.userRole && (
                <Badge variant="secondary" className="text-xs">
                  {status.userRole === 'admin' ? 'Administrator' : 
                   status.userRole === 'supply_room_staff' ? 'Supply Staff' : 
                   status.userRole.charAt(0).toUpperCase() + status.userRole.slice(1)}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!status.notificationPreferences)}
              <span className="font-medium">Notification Preferences</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {status.notificationPreferences ? 'Configured' : 'Default'}
            </div>
          </div>


        </div>

        {status.errors.length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="font-medium text-destructive mb-2">Errors Found:</h4>
            <ul className="text-sm text-destructive space-y-1">
              {status.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {status.profileData && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Profile Data Summary:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Email:</strong> {status.profileData.email}</p>
              <p><strong>Phone:</strong> {status.profileData.phone || 'Not set'}</p>
              <p><strong>Title:</strong> {status.profileData.title || 'Not set'}</p>
              <p><strong>Bio:</strong> {status.profileData.bio ? 'Set' : 'Not set'}</p>
              <p><strong>Avatar:</strong> {status.profileData.avatar_url ? 'Set' : 'Not set'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
