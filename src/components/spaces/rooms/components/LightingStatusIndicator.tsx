
import React from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LightingFixture {
  id: string;
  status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
  type: "standard" | "emergency" | "motion_sensor";
  technology?: "LED" | "Fluorescent" | "Bulb" | null;
  electrical_issues?: {
    short_circuit: boolean;
    wiring_issues: boolean;
    voltage_problems: boolean;
  };
  ballast_issue?: boolean;
  maintenance_notes?: string;
}

interface LightingStatusIndicatorProps {
  fixture?: LightingFixture | null;
}

export function LightingStatusIndicator({ fixture }: LightingStatusIndicatorProps) {
  if (!fixture) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-2">
              <Lightbulb className="h-4 w-4 text-gray-400" />
              <span>No Lighting</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>No lighting fixture assigned</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const hasElectricalIssues = fixture.electrical_issues && (
    fixture.electrical_issues.short_circuit ||
    fixture.electrical_issues.wiring_issues ||
    fixture.electrical_issues.voltage_problems
  );

  const getStatusColor = () => {
    if (hasElectricalIssues || fixture.status === 'non_functional') {
      return "text-red-500";
    }
    if (fixture.status === 'maintenance_needed' || fixture.status === 'scheduled_replacement') {
      return "text-yellow-500";
    }
    return "text-green-500";
  };

  const getStatusText = () => {
    if (hasElectricalIssues) return "Electrical Issues";
    if (fixture.ballast_issue) return "Balance Issues";
    switch (fixture.status) {
      case 'functional': return "Working";
      case 'maintenance_needed': return "Needs Maintenance";
      case 'non_functional': return "Not Working";
      case 'pending_maintenance': return "Maintenance Pending";
      case 'scheduled_replacement': return "Replacement Needed";
      default: return "Unknown";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={cn("gap-2", hasElectricalIssues && "border-red-200")}>
            <Lightbulb className={cn("h-4 w-4", getStatusColor())} />
            <span>{getStatusText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p>Status: {getStatusText()}</p>
            {fixture.technology && <p>Type: {fixture.technology}</p>}
            {fixture.maintenance_notes && (
              <p className="text-sm text-muted-foreground">
                Note: {fixture.maintenance_notes}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
