import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { ChartContext } from "../context/ChartContext";
import { ChartStyle } from "../styles/ChartStyle";
import { getChartId } from "../utils/chartUtils";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "../context/ChartContext";

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = getChartId(id, uniqueId);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn("w-full h-[400px]", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
