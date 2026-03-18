import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle, Wrench, XCircle } from "lucide-react";
import { LightStatus } from "@/types/lighting";

interface FixtureStatusIconProps {
  status: LightStatus;
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
  className?: string;
}

const statusConfig: Record<LightStatus, { 
  icon: typeof Lightbulb; 
  color: string; 
  bgColor: string;
  glowColor: string;
  label: string;
}> = {
  functional: {
    icon: Lightbulb,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    glowColor: "shadow-emerald-500/50",
    label: "Working"
  },
  maintenance_needed: {
    icon: Wrench,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    glowColor: "shadow-amber-500/50",
    label: "Needs Maintenance"
  },
  non_functional: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    glowColor: "shadow-destructive/50",
    label: "Not Working"
  },
  pending_maintenance: {
    icon: Wrench,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    glowColor: "shadow-orange-500/50",
    label: "Pending Maintenance"
  },
  scheduled_replacement: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    glowColor: "shadow-red-400/50",
    label: "Scheduled Replacement"
  }
};

const sizeClasses = {
  sm: { container: "w-8 h-8", icon: "h-4 w-4" },
  md: { container: "w-12 h-12", icon: "h-6 w-6" },
  lg: { container: "w-16 h-16", icon: "h-8 w-8" }
};

export function FixtureStatusIcon({ 
  status, 
  size = "md", 
  showGlow = true,
  className 
}: FixtureStatusIconProps) {
  const config = statusConfig[status] || statusConfig.functional;
  const Icon = config.icon;
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300",
        config.bgColor,
        sizeClass.container,
        showGlow && status === 'functional' && `shadow-lg ${config.glowColor}`,
        className
      )}
    >
      <Icon className={cn(sizeClass.icon, config.color)} />
      {status === 'functional' && showGlow && (
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-pulse" />
      )}
    </div>
  );
}

export function getStatusLabel(status: LightStatus): string {
  return statusConfig[status]?.label || "Unknown";
}

export function getStatusColor(status: LightStatus): string {
  return statusConfig[status]?.color || "text-muted-foreground";
}
