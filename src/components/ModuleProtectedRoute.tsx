import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useEnabledModules, EnabledModules } from '@/hooks/useEnabledModules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft } from 'lucide-react';

interface ModuleProtectedRouteProps {
  children: ReactNode;
  moduleKey: keyof EnabledModules;
  moduleName: string;
}

export function ModuleProtectedRoute({ children, moduleKey, moduleName }: ModuleProtectedRouteProps) {
  const { enabledModules, loading } = useEnabledModules();

  // Always enforce module gating

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const isModuleEnabled = enabledModules[moduleKey];
  
  // Debug logging
  console.log(`ModuleProtectedRoute Debug for ${moduleKey}:`, {
    isModuleEnabled,
    enabledModules,
    loading
  });

  if (!isModuleEnabled) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Module Disabled</CardTitle>
            <CardDescription>
              The {moduleName} module has been disabled in your admin preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              To access this module, you can enable it in your Admin Profile settings under Module Management.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild>
                <NavLink to="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Center
                </NavLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}