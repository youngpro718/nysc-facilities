import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, UserCog, Mail, Shield, Wrench } from 'lucide-react';

interface Feature {
  name: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
}

const enhancedUserControlsFeatures: Feature[] = [
  {
    name: 'Password Reset',
    description: 'Send password reset emails to any user',
    icon: Mail,
    available: true,
  },
  {
    name: 'Account Suspension',
    description: 'Suspend/unsuspend user accounts with reasons',
    icon: Lock,
    available: true,
  },
  {
    name: 'Profile Editing',
    description: 'Edit user profiles including name, email, department',
    icon: UserCog,
    available: true,
  },
  {
    name: 'Verification Override',
    description: 'Manually verify users and set approval status',
    icon: Shield,
    available: true,
  },
  {
    name: 'Account Fixes',
    description: 'One-click fix for account issues',
    icon: Wrench,
    available: true,
  },
  {
    name: 'Audit Logging',
    description: 'All actions are logged for security audit',
    icon: CheckCircle,
    available: true,
  },
];

export function FeatureDiscoveryCard() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Enhanced User Controls
        </CardTitle>
        <CardDescription>
          Advanced user management capabilities available to administrators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {enhancedUserControlsFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{feature.name}</p>
                    {feature.available && (
                      <Badge variant="secondary" className="text-xs h-5">
                        Available
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
