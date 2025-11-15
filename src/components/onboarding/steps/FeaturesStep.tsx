import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Users, 
  Wrench, 
  Package, 
  Key, 
  Lightbulb,
  AlertTriangle,
  BarChart3 
} from "lucide-react";

const features = [
  {
    icon: Building,
    title: "Space Management",
    description: "View and manage building layouts, rooms, and occupancy",
    badge: "Core"
  },
  {
    icon: Users,
    title: "Occupant Management",
    description: "Track residents, staff, and visitor information",
    badge: "Core"
  },
  {
    icon: AlertTriangle,
    title: "Issue Reporting",
    description: "Report and track maintenance issues and problems",
    badge: "Essential"
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Schedule and manage facility maintenance tasks",
    badge: "Pro"
  },
  {
    icon: Package,
    title: "Inventory",
    description: "Track supplies, equipment, and resources",
    badge: "Pro"
  },
  {
    icon: Key,
    title: "Key Management",
    description: "Manage access keys and security assignments",
    badge: "Pro"
  },
  {
    icon: Lightbulb,
    title: "Energy Management",
    description: "Monitor and optimize facility energy usage",
    badge: "Advanced"
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "View reports and insights on facility operations",
    badge: "Advanced"
  }
];

export function FeaturesStep() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold">Explore Your Features</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Discover what you can do with the NYSC Facilities Hub. Your access level determines which features are available.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Card key={index} className="relative hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                  <Badge 
                    variant={
                      feature.badge === 'Core' ? 'default' :
                      feature.badge === 'Essential' ? 'secondary' :
                      feature.badge === 'Pro' ? 'outline' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {feature.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 rounded-lg bg-muted/50 border">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Ready to Get Started?</p>
          <p className="text-xs text-muted-foreground">
            You'll have access to features based on your role and permissions. 
            Start with the basics and explore more advanced features as you need them.
          </p>
        </div>
      </div>
    </div>
  );
}