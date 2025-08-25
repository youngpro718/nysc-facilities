import { LightingFixturesListWithSelection } from "@/components/lighting/LightingFixturesListWithSelection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { CreateLightingDialog } from "@/components/lighting/CreateLightingDialog";
import { 
  Download, 
  Filter, 
  MoreHorizontal,
  Settings,
  Trash2,
  Wrench,
  CheckCircle,
  Plus,
  MapPin,
  ZapOff,
  Timer
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";

export function SmartFixturesView() {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const { handleBulkDelete, handleBulkStatusUpdate } = useLightingFixtures();

  const handleBulkAction = async (action: string) => {
    if (selectedFixtures.length === 0) {
      toast.error("Please select fixtures to perform bulk actions");
      return;
    }

    switch (action) {
      case 'maintenance':
        // Schedule maintenance for selected fixtures
        toast.success(`Scheduled maintenance for ${selectedFixtures.length} fixtures`);
        break;
      case 'working':
        await handleBulkStatusUpdate(selectedFixtures, 'functional');
        break;
      case 'out_of_order':
        await handleBulkStatusUpdate(selectedFixtures, 'non_functional');
        break;
      case 'maintenance_needed':
        await handleBulkStatusUpdate(selectedFixtures, 'maintenance_needed');
        break;
      case 'assign_zone':
        toast.info("Zone assignment coming soon...");
        break;
      case 'delete':
        const success = await handleBulkDelete(selectedFixtures);
        if (success) {
          setSelectedFixtures([]);
        }
        break;
      case 'export':
        toast.success("Exporting fixture data...");
        // Implement CSV export logic here
        break;
      default:
        toast.info(`Action: ${action}`);
    }
    
    if (action !== 'delete') {
      setSelectedFixtures([]);
    }
  };

  const handleSettings = () => {
    toast.info("Opening fixture management settings...");
    // TODO: Implement settings modal
  };

  return (
    <div className="space-y-4">
      {/* Compact Action Bar */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-3">
          <CreateLightingDialog 
            onFixtureCreated={() => console.log('Fixture created')}
            onZoneCreated={() => console.log('Zone created')}
          />
          {selectedFixtures.length > 0 && (
            <Badge variant="secondary">
              {selectedFixtures.length} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={selectedFixtures.length === 0}
              >
                Bulk Actions
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleBulkAction('working')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Working
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('maintenance_needed')}>
                <Timer className="h-4 w-4 mr-2" />
                Needs Maintenance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('out_of_order')}>
                <ZapOff className="h-4 w-4 mr-2" />
                Mark Out of Order
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction('assign_zone')}>
                <MapPin className="h-4 w-4 mr-2" />
                Assign to Zone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('maintenance')}>
                <Wrench className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('export')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fixtures List */}
      <LightingFixturesListWithSelection 
        selectedFixtures={selectedFixtures}
        onSelectionChange={setSelectedFixtures}
      />
    </div>
  );
}