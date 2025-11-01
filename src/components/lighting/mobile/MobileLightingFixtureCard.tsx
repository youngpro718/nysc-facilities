import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Lightbulb, 
  MapPin, 
  Zap, 
  Calendar,
  AlertTriangle,
  Settings,
  MoreVertical
} from "lucide-react";
import { MobileCardView } from "@/components/mobile/MobileCardView";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";
import { useState } from "react";

interface MobileLightingFixtureCardProps {
  fixture: {
    id: string;
    name: string;
    type: string;
    status: string;
    location: string;
    wattage?: number;
    lastMaintenance?: string;
    nextMaintenance?: string;
    energyConsumption?: number;
    issues?: number;
  };
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onEdit: () => void;
  onMaintenance: () => void;
  onViewDetails: () => void;
}

export function MobileLightingFixtureCard({
  fixture,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  onMaintenance,
  onViewDetails
}: MobileLightingFixtureCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'operational':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'offline':
      case 'broken':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    return <Lightbulb className="h-4 w-4" />;
  };

  const actions = [
    {
      id: 'view',
      label: 'View Details',
      icon: <Settings className="h-4 w-4" />,
      onClick: onViewDetails
    },
    {
      id: 'edit',
      label: 'Edit Fixture',
      icon: <Settings className="h-4 w-4" />,
      onClick: onEdit
    },
    {
      id: 'maintenance',
      label: 'Schedule Maintenance',
      icon: <Calendar className="h-4 w-4" />,
      onClick: onMaintenance
    },
    {
      id: 'delete',
      label: 'Delete Fixture',
      icon: <AlertTriangle className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive' as const
    }
  ];

  return (
    <>
      <MobileCardView
        title={fixture.name}
        subtitle={fixture.type}
        description={fixture.location}
        status={{
          label: fixture.status,
          variant: fixture.status === 'functional' ? 'default' : 
                   fixture.status === 'maintenance_needed' ? 'secondary' : 
                   'destructive'
        }}
        quickActions={[
          {
            icon: <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />,
            label: "Select",
            onClick: () => onSelect(!isSelected)
          },
          {
            icon: <MoreVertical className="h-4 w-4" />,
            label: "More",
            onClick: () => setShowActions(true)
          }
        ]}
        onCardClick={onViewDetails}
        className="hover:shadow-md transition-shadow"
      >
        <div className="space-y-3">
          {/* Fixture details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="text-muted-foreground">
                Wattage: {fixture.wattage ? `${fixture.wattage}W` : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">
                Next: {fixture.nextMaintenance || "Not scheduled"}
              </span>
            </div>
          </div>

          {/* Additional info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {fixture.energyConsumption && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-600" />
                <span className="text-muted-foreground">Energy: {fixture.energyConsumption}kWh</span>
              </div>
            )}
            {fixture.issues && fixture.issues > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span className="text-red-600">{fixture.issues} issues</span>
              </div>
            )}
          </div>
        </div>
      </MobileCardView>

      <MobileActionSheet
        trigger={<></>}
        title={`Actions for ${fixture.name}`}
        description="Choose an action to perform on this lighting fixture"
        actions={actions}
        open={showActions}
        onOpenChange={setShowActions}
      />
    </>
  );
}