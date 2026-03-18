import { Building2, Users, Settings, Shield, Package, AlertTriangle } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="text-center space-y-8 py-4">
      <div className="space-y-4">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome to the Hub
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            Your central platform for managing facilities and staying connected with your team.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {[
          { icon: Users, title: "Team Coordination", desc: "Connect with colleagues and manage occupancy" },
          { icon: Settings, title: "Facility Management", desc: "Handle maintenance and operations" },
          { icon: Package, title: "Supply Requests", desc: "Order supplies and track deliveries" },
          { icon: AlertTriangle, title: "Issue Reporting", desc: "Report problems and track resolutions" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 p-4 rounded-xl border bg-card text-left"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4 shrink-0" />
        <span>Your account is secure and all data is protected</span>
      </div>
    </div>
  );
}