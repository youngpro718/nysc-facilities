import { Building2, Users, Settings, Shield } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Welcome to the Hub</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your central platform for managing facilities, coordinating operations, 
          and staying connected with your team.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <div className="p-4 rounded-lg border bg-card text-left space-y-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Team Coordination</h3>
          <p className="text-sm text-muted-foreground">
            Connect with colleagues and manage occupancy
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card text-left space-y-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Facility Management</h3>
          <p className="text-sm text-muted-foreground">
            Handle maintenance, inventory, and operations
          </p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          Your account is secure and all data is protected
        </div>
      </div>
    </div>
  );
}