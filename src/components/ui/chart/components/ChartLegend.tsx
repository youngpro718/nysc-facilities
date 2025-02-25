import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { useChart } from "../context/ChartContext";
import { getPayloadConfigFromPayload } from "../utils/chartUtils";
import { cn } from "@/lib/utils";

export const ChartLegend = RechartsPrimitive.Legend;

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: Array<{
      value?: string;
      dataKey?: string;
      color?: string;
    }>;
  }
>(({ className, payload, ...props }, ref) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div ref={ref} className={cn("flex flex-wrap gap-4", className)} {...props}>
      {payload.map((item, i) => {
        const labelConfig = getPayloadConfigFromPayload(config, item, "label");
        const iconConfig = getPayloadConfigFromPayload(config, item, "icon");
        const label = labelConfig?.value ?? item.value;
        const Icon = iconConfig?.value;
        const color = item.color ?? `var(--${item.dataKey})`;

        return (
          <div key={i} className="flex items-center gap-2">
            {Icon ? (
              <Icon />
            ) : (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            {label && <div className="text-sm font-medium">{label}</div>}
          </div>
        );
      })}
    </div>
  );
});
