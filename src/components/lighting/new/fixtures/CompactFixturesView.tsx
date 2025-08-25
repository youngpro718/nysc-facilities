import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LightingFixturesListWithSelection } from "../../LightingFixturesListWithSelection";
import { CreateLightingDialog } from "../../CreateLightingDialog";
import { useLightingFixtures } from "../../hooks/useLightingFixtures";
import { toast } from "sonner";
import { LightStatus } from "@/types/lighting";

export function CompactFixturesView() {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  const { handleBulkDelete, handleBulkStatusUpdate, refetch } = useLightingFixtures();

  const handleBulkAction = async (action: string) => {
    if (selectedFixtures.length === 0) {
      toast.error("Please select fixtures first");
      return;
    }

    switch (action) {
      case 'mark-working':
        await handleBulkStatusUpdate(selectedFixtures, 'functional' as LightStatus);
        setSelectedFixtures([]);
        break;
      case 'mark-maintenance':
        await handleBulkStatusUpdate(selectedFixtures, 'maintenance_needed' as LightStatus);
        setSelectedFixtures([]);
        break;
      case 'mark-broken':
        await handleBulkStatusUpdate(selectedFixtures, 'non_functional' as LightStatus);
        setSelectedFixtures([]);
        break;
      case 'delete':
        if (confirm(`Delete ${selectedFixtures.length} selected fixtures?`)) {
          await handleBulkDelete(selectedFixtures);
          setSelectedFixtures([]);
        }
        break;
      case 'export':
        toast.info(`Exporting data for ${selectedFixtures.length} fixtures`);
        break;
      case 'assign-zone':
        toast.info('Zone assignment feature coming soon');
        break;
      case 'schedule-maintenance':
        toast.info('Maintenance scheduling feature coming soon');
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Left side - Search and Add */}
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search fixtures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <CreateLightingDialog 
            onFixtureCreated={refetch}
            onZoneCreated={refetch}
          />
        </div>

        {/* Right side - Actions and Filters */}
        <div className="flex items-center gap-2">
          {selectedFixtures.length > 0 && (
            <Badge variant="secondary" className="px-3">
              {selectedFixtures.length} selected
            </Badge>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="functional">Functional</option>
            <option value="maintenance_needed">Needs Maintenance</option>
            <option value="non_functional">Non-Functional</option>
            <option value="scheduled_replacement">Needs Replacement</option>
          </select>

          {/* Bulk Actions Menu */}
          {selectedFixtures.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleBulkAction('mark-working')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Working
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('mark-maintenance')}>
                  Mark as Needs Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('mark-broken')}>
                  Mark as Non-Functional
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction('assign-zone')}>
                  Assign to Zone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('schedule-maintenance')}>
                  Schedule Maintenance
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('delete')}
                  className="text-destructive"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Refresh Button */}
          <Button variant="outline" size="icon" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fixtures List */}
      <LightingFixturesListWithSelection
        selectedFixtures={selectedFixtures}
        onSelectionChange={setSelectedFixtures}
        statusFilter={statusFilter}
        refetch={refetch}
      />
    </div>
  );
}