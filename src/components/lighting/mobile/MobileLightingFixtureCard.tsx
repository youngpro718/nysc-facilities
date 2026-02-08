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
import { LightingFixture } from "@/types/lighting";
import * as locationUtil from "@/components/lighting/utils/location";

interface MobileLightingFixtureCardProps {
  fixture: LightingFixture;
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
    switch (status) {
      case 'functional':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'maintenance_needed':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'non_functional':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
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
        description={locationUtil.getFixtureFullLocationText(fixture)}
        status={{
          label: fixture.status.replace('_', ' '),
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
              <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-muted-foreground">
                {fixture.bulb_count}x {fixture.technology || 'Bulb'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-muted-foreground">
                Next: {fixture.next_maintenance_date ? new Date(fixture.next_maintenance_date).toLocaleDateString() : "Not scheduled"}
              </span>
            </div>
          </div>

          {/* Additional info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
             <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-muted-foreground">{fixture.position}</span>
             </div>
            {fixture.status !== 'functional' && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400">Issues Detected</span>
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