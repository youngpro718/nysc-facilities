/**
 * StockStatusBadge - Consistent stock status display across inventory views
 */

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

interface StockStatusBadgeProps {
  quantity: number;
  minimumQuantity?: number;
  showIcon?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function getStockStatus(quantity: number, minimumQuantity: number = 0): StockStatus {
  if (quantity === 0) return "out_of_stock";
  if (minimumQuantity > 0 && quantity < minimumQuantity) return "low_stock";
  return "in_stock";
}

export function getStockStatusInfo(status: StockStatus) {
  switch (status) {
    case "out_of_stock":
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        className: "",
        icon: XCircle,
      };
    case "low_stock":
      return {
        label: "Low Stock",
        variant: undefined,
        className: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        icon: AlertTriangle,
      };
    case "in_stock":
      return {
        label: "In Stock",
        variant: undefined,
        className: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        icon: CheckCircle,
      };
  }
}

export function StockStatusBadge({
  quantity,
  minimumQuantity = 0,
  showIcon = false,
  size = "default",
  className,
}: StockStatusBadgeProps) {
  const status = getStockStatus(quantity, minimumQuantity);
  const info = getStockStatusInfo(status);
  const Icon = info.icon;

  return (
    <Badge
      variant={info.variant}
      className={cn(
        info.className,
        size === "sm" && "text-xs px-1.5 py-0",
        showIcon && "gap-1",
        className
      )}
    >
      {showIcon && <Icon className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5")} />}
      {info.label}
    </Badge>
  );
}
