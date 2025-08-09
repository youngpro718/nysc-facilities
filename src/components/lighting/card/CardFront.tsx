
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LightingFixture } from "@/types/lighting";
import { EditLightingDialog } from "../EditLightingDialog";
import { ReportIssueDialog } from "../issues/ReportIssueDialog";
import { cn } from "@/lib/utils";
import { Lightbulb, RotateCw, Trash2, Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLightingIssuesForFixture } from "@/services/supabase/lightingIssuesService";
import { useNavigate } from "react-router-dom";
import * as locationUtil from "@/components/lighting/utils/location";
import { StatusBadge } from "@/components/lighting/components/StatusBadge";

interface CardFrontProps {
  fixture: LightingFixture;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onFixtureUpdated: () => void;
  onFlip: () => void;
}

export function CardFront({ 
  fixture, 
  isSelected, 
  onSelect, 
  onDelete, 
  onFixtureUpdated,
  onFlip
}: CardFrontProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  // Fetch any issues related to this fixture
  const { data: fixtureIssues } = useQuery({
    queryKey: ["lighting-fixture-issues", fixture.id],
    queryFn: () => getLightingIssuesForFixture(fixture.id),
  });

  const openIssue = (fixtureIssues || []).find((i: any) => i.status !== "resolved" && (i.issue_id || i.id));

  // Status colors centralized in StatusBadge

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'emergency':
        return <Badge variant="destructive" className="text-xs">Emergency</Badge>;
      case 'motion_sensor':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800">Motion Sensor</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Standard</Badge>;
    }
  };

  const formatMaintenanceDate = (date: string | null | undefined) => {
    if (!date) return "No date scheduled";
    const maintenanceDate = new Date(date);
    return maintenanceDate.toLocaleDateString();
  };

  const isMaintenanceSoon = () => {
    if (!fixture.next_maintenance_date) return false;
    const nextMaintenance = new Date(fixture.next_maintenance_date);
    const today = new Date();
    const daysUntilMaintenance = Math.floor((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0;
  };

  // Use shared location formatter for consistency across the module
  const getLocationText = () => locationUtil.getFixtureFullLocationText(fixture);

  return (
    <Card className={cn(
      "w-full h-full overflow-hidden transition-all duration-200",
      isSelected && "ring-2 ring-primary"
    )}>
      <div className="absolute top-4 left-4 z-10">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onFlip}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pt-6 pb-1">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            {getTypeIcon(fixture.type)}
            <StatusBadge status={fixture.status} />
          </div>
          <h3 className="font-medium text-sm truncate">{fixture.name}</h3>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Technology</div>
          <div className="font-medium">{fixture.technology || 'N/A'}</div>
          
          <div className="text-muted-foreground">Bulbs</div>
          <div className="font-medium flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            {fixture.bulb_count}
          </div>
          
          <div className="text-muted-foreground">Zone</div>
          <div className="font-medium">{fixture.zone_name || 'Unassigned'}</div>
          
          <div className="text-muted-foreground">Position</div>
          <div className="font-medium">{fixture.position || 'N/A'}</div>
        </div>

        <div className="text-xs text-muted-foreground truncate">
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-1">
            {getLocationText()}
          </span>
        </div>

        {fixture.next_maintenance_date && (
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
            isMaintenanceSoon() ? "bg-yellow-50 text-yellow-800" : "bg-blue-50 text-blue-800"
          )}>
            <Calendar className="h-3 w-3" />
            <span>Maintenance: {formatMaintenanceDate(fixture.next_maintenance_date)}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Confirm?</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onDelete}
              >
                Yes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {openIssue ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const issueId = (openIssue as any).issue_id ?? (openIssue as any).id;
                    navigate(`/operations?issue_id=${issueId}`);
                  }}
                >
                  View Issue
                </Button>
              ) : (
                <ReportIssueDialog fixture={fixture} />
              )}
              <EditLightingDialog
                fixture={fixture}
                onFixtureUpdated={onFixtureUpdated}
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
