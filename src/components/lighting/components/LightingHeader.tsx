import { Button } from "@/components/ui/button";
import { CreateLightingDialog } from "../CreateLightingDialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { RefreshCw, CheckSquare, XSquare, Download, Layers } from "lucide-react";
import { LightingFixture } from "../types";
import { AssignZoneDialog } from "./AssignZoneDialog";

export interface LightingHeaderProps {
  selectedFixtures: string[];
  fixtures: LightingFixture[] | undefined;
  onSelectAll: () => void;
  onBulkStatusUpdate?: (status: LightingFixture['status']) => void;
  onBulkDelete: () => void;
  onFixtureCreated: () => void;
}

export const LightingHeader = ({
  selectedFixtures,
  fixtures,
  onSelectAll,
  onBulkStatusUpdate,
  onBulkDelete,
  onFixtureCreated
}: LightingHeaderProps) => {
  const exportSelectedFixtures = () => {
    if (!fixtures) return;
    
    const selectedData = fixtures.filter(f => selectedFixtures.includes(f.id));
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Type,Status,Zone,Building,Floor,Room Number\n" +
      selectedData.map(f => 
        `"${f.name}","${f.type}","${f.status}","${f.zone_name || 'Unassigned'}","${f.building_name || ''}","${f.floor_name || ''}","${f.room_number || ''}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "selected_fixtures.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Lighting Management</h1>
      <div className="flex items-center gap-2">
        {selectedFixtures.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="flex items-center gap-2"
            >
              {selectedFixtures.length === fixtures?.length ? (
                <XSquare className="h-4 w-4" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
              {selectedFixtures.length === fixtures?.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            <AssignZoneDialog 
              selectedFixtures={selectedFixtures}
              onComplete={onFixtureCreated}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({selectedFixtures.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onBulkStatusUpdate && (
                  <>
                    <DropdownMenuItem onClick={() => onBulkStatusUpdate('functional')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Mark as Functional
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkStatusUpdate('maintenance_needed')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Mark as Needs Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onBulkDelete}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSelectedFixtures}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <CreateLightingDialog 
          onFixtureCreated={onFixtureCreated} 
          onZoneCreated={onFixtureCreated}
        />
      </div>
    </div>
  );
};
