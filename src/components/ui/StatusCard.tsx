import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "critical"
  | "warning"
  | "operational"
  | "info"
  | "neutral"
  | "none";

interface StatusCardProps {
  statusVariant?: StatusVariant;
  title: string;
  value: string | number;
  subLabel?: string;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
}

const variantBorderClasses: Record<StatusVariant, string> = {
  critical: "border-l-[3px] border-l-status-critical",
  warning: "border-l-[3px] border-l-status-warning",
  operational: "border-l-[3px] border-l-status-operational",
  info: "border-l-[3px] border-l-status-info",
  neutral: "border-l-[3px] border-l-status-neutral",
  none: "",
};

const variantIconClasses: Record<StatusVariant, string> = {
  critical: "text-status-critical",
  warning: "text-status-warning",
  operational: "text-status-operational",
  info: "text-status-info",
  neutral: "text-status-neutral",
  none: "text-muted-foreground",
};

export function StatusCard({
  statusVariant = "none",
  title,
  value,
  subLabel,
  icon: Icon,
  className,
  onClick,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-all duration-150 ease-in-out",
        "hover:bg-card-hover hover:-translate-y-px hover:border-border/80",
        "active:translate-y-0",
        variantBorderClasses[statusVariant],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subLabel && (
            <p className="text-[13px] text-text-secondary">{subLabel}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex-shrink-0 mt-1",
              variantIconClasses[statusVariant]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
