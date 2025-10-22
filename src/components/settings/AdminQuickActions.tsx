import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, Shield, Package, FileText, Upload, GitFork } from 'lucide-react';
import { useState } from 'react';
import { EnhancedUserManagementModal } from '@/components/profile/modals/EnhancedUserManagementModal';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  badge?: string;
  variant?: 'default' | 'outline';
}

export function AdminQuickActions() {
  const navigate = useNavigate();
  const [enhancedUserManagementOpen, setEnhancedUserManagementOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      title: 'User Management',
      description: 'Advanced user controls with password reset, suspension, and profile editing',
      icon: Users,
      action: () => setEnhancedUserManagementOpen(true),
      badge: 'Enhanced',
      variant: 'default',
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings, database, and maintenance',
      icon: Settings,
      action: () => navigate('/system-settings'),
      variant: 'outline',
    },
    {
      title: 'Security Audit',
      description: 'View security logs and audit sensitive access',
      icon: Shield,
      action: () => navigate('/admin-profile?tab=security'),
      variant: 'outline',
    },
    {
      title: 'Module Management',
      description: 'Enable/disable system modules and features',
      icon: Package,
      action: () => navigate('/system-settings'),
      variant: 'outline',
    },
    {
      title: 'Form Templates',
      description: 'View and manage form templates for requests and reports',
      icon: FileText,
      action: () => navigate('/form-templates'),
      badge: 'New',
      variant: 'outline',
    },
    {
      title: 'Form Intake',
      description: 'Upload and process PDF forms with AI extraction',
      icon: Upload,
      action: () => navigate('/form-intake'),
      badge: 'AI',
      variant: 'outline',
    },
    {
      title: 'Routing Rules',
      description: 'Configure automatic form routing and processing rules',
      icon: GitFork,
      action: () => navigate('/admin/routing-rules'),
      variant: 'outline',
    },
  ];

  return (
    <>
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Administrator Quick Actions
          </CardTitle>
          <CardDescription>
            Access advanced features and system management tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-start gap-2 text-left"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold flex-1">{action.title}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-normal">
                    {action.description}
                  </p>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EnhancedUserManagementModal 
        open={enhancedUserManagementOpen} 
        onOpenChange={setEnhancedUserManagementOpen} 
      />
    </>
  );
}
