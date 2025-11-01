import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { useChart } from "../context/ChartContext";
import { getPayloadConfigFromPayload } from "../utils/chartUtils";
import { cn } from "@/lib/utils";

export const ChartTooltip = RechartsPrimitive.Tooltip;

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: Array<{
      value?: number | string;
      name?: string;
      dataKey?: string;
      color?: string;
    }>;
    label?: string;
  }
>(({ className, active, payload, label, ...props }, ref) => {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg bg-background px-3 py-2 shadow-md border",
        className
      )}
      {...props}
    >
      <div className="grid gap-2">
        {label && (
          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, i) => {
            const labelConfig = getPayloadConfigFromPayload(config, item, "label");
            const label = labelConfig?.value ?? item.name;
            const color = item.color ?? `var(--${item.dataKey})`;

            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex gap-1 text-sm">
                  {label && <div className="font-medium">{label}:</div>}
                  <div>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
