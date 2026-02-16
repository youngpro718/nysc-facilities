import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Building, 
  Users, 
  Wrench, 
  Package, 
  Key, 
  Lightbulb,
  AlertTriangle,
  BarChart3,
  type LucideIcon
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const features: Feature[] = [
  {
    icon: Building,
    title: "Space Management",
    description: "Building layouts, rooms & occupancy",
    badge: "Core",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    icon: Users,
    title: "Occupant Management",
    description: "Staff, residents & visitor tracking",
    badge: "Core",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    icon: AlertTriangle,
    title: "Issue Reporting",
    description: "Report & track maintenance issues",
    badge: "Essential",
    badgeColor: "bg-green-500/10 text-green-600 dark:text-green-400"
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Schedule & manage facility tasks",
    badge: "Pro",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    icon: Package,
    title: "Inventory & Supplies",
    description: "Track supplies, equipment & orders",
    badge: "Pro",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    icon: Key,
    title: "Key Management",
    description: "Access keys & security assignments",
    badge: "Pro",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    icon: Lightbulb,
    title: "Energy Management",
    description: "Monitor & optimize energy usage",
    badge: "Advanced",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Reports & operational insights",
    badge: "Advanced",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  }
];

export function FeaturesStep() {
  return (
    <div className="space-y-6 py-2">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Explore Your Features
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your access level determines which features are available.
        </p>
      </div>

      <div className="space-y-2">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3.5 rounded-xl border bg-card active:bg-accent/50 transition-colors"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {feature.description}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn("text-[10px] shrink-0 font-medium", feature.badgeColor)}
              >
                {feature.badge}
              </Badge>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Start with the basics and explore more as you need them.
      </p>
    </div>
  );
}