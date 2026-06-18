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
  critical: "border-l-2 border-l-status-critical",
  warning: "border-l-2 border-l-status-warning",
  operational: "border-l-2 border-l-status-operational",
  info: "border-l-2 border-l-status-info",
  neutral: "border-l-2 border-l-status-neutral",
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

const variantBgClasses: Record<StatusVariant, string> = {
  critical: "bg-status-critical/[0.04] dark:bg-status-critical/[0.06]",
  warning: "bg-status-warning/[0.04] dark:bg-status-warning/[0.06]",
  operational: "bg-status-operational/[0.04] dark:bg-status-operational/[0.06]",
  info: "bg-status-info/[0.04] dark:bg-status-info/[0.06]",
  neutral: "",
  none: "",
};

const variantIconBgClasses: Record<StatusVariant, string> = {
  critical: "bg-status-critical/10",
  warning: "bg-status-warning/10",
  operational: "bg-status-operational/10",
  info: "bg-status-info/10",
  neutral: "bg-muted",
  none: "bg-muted",
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
        "rounded-md border border-border bg-card p-3 sm:p-5 transition-all duration-150 ease-in-out",
        "hover:-translate-y-px hover:border-border/80",
        "active:translate-y-0",
        variantBorderClasses[statusVariant],
        variantBgClasses[statusVariant],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-text-secondary">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subLabel && (
            <p className="text-[11px] sm:text-[13px] text-text-secondary">{subLabel}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex-shrink-0 mt-1 p-2 rounded-lg",
              variantIconBgClasses[statusVariant]
            )}
          >
            <Icon className={cn(
              "h-5 w-5 sm:h-6 sm:w-6",
              variantIconClasses[statusVariant]
            )} />
          </div>
        )}
      </div>
    </div>
  );
}
