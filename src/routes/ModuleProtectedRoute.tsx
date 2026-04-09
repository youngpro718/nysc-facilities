import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useEnabledModules, EnabledModules } from '@shared/hooks/useEnabledModules';
import { useAuth } from '@features/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft, Loader2 } from 'lucide-react';

interface ModuleProtectedRouteProps {
  children: ReactNode;
  moduleKey: keyof EnabledModules;
  moduleName: string;
}

export function ModuleProtectedRoute({ children, moduleKey, moduleName }: ModuleProtectedRouteProps) {
  const { enabledModules, loading } = useEnabledModules();
  const { isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking module access...</p>
        </div>
      </div>
    );
  }

  const isModuleEnabled = enabledModules[moduleKey];

  if (!isModuleEnabled) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Feature not available</CardTitle>
            <CardDescription>
              The {moduleName} module is currently turned off for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              If you believe this is a mistake, ask an administrator to enable the {moduleName} module in Admin Center.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              {isAdmin && (
                <Button asChild>
                  <NavLink to="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Center
                  </NavLink>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}