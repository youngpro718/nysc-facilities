import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Mail, 
  User, 
  Home, 
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Permission {
  name: string;
  required: boolean;
  hasPermission: boolean;
}

interface EnhancedAccessDeniedProps {
  title?: string;
  description?: string;
  requiredPermissions?: string[];
  currentPermissions?: Record<string, string | null>;
  contactEmail?: string;
  helpUrl?: string;
  showRequestAccess?: boolean;
}

export function EnhancedAccessDenied({
  title = 'Access Restricted',
  description = "You don't have permission to access this page.",
  requiredPermissions = [],
  currentPermissions = {},
  contactEmail = 'support@example.com',
  helpUrl,
  showRequestAccess = true,
}: EnhancedAccessDeniedProps) {
  const navigate = useNavigate();

  const handleRequestAccess = () => {
    const subject = encodeURIComponent(`Access Request: ${title}`);
    const body = encodeURIComponent(
      `I would like to request access to: ${title}\n\n` +
      `Required permissions:\n${requiredPermissions.map(p => `- ${p}`).join('\n')}\n\n` +
      `Reason for request:\n[Please describe why you need access]`
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Description */}
          <Alert>
            <AlertDescription>{description}</AlertDescription>
          </Alert>

          {/* Required Permissions */}
          {requiredPermissions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Required Permissions</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                {requiredPermissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                    <span className="text-sm">{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Permissions */}
          {Object.keys(currentPermissions).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Your Current Permissions</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                {Object.entries(currentPermissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{key}</span>
                    {value ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {value}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        None
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What You Can Do */}
          <div className="space-y-3">
            <h3 className="font-semibold">What You Can Do</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-semibold">1.</span>
                <span>Request access from your supervisor or department head</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold">2.</span>
                <span>Contact IT Support at {contactEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold">3.</span>
                <span>Check your current permissions in your profile</span>
              </div>
              {helpUrl && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Visit the help center for more information</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {showRequestAccess && (
              <Button onClick={handleRequestAccess} className="flex-1 min-w-[200px]">
                <Mail className="mr-2 h-4 w-4" />
                Request Access
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="flex-1 min-w-[200px]"
            >
              <User className="mr-2 h-4 w-4" />
              View My Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1 min-w-[200px]"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Help Link */}
          {helpUrl && (
            <div className="text-center text-sm text-muted-foreground">
              Need help?{' '}
              <a
                href={helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Visit our help center
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
