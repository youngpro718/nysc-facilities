import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, RefreshCw, Filter, Lightbulb } from "lucide-react";
import { CreateLightingDialog } from "../../CreateLightingDialog";
import { LightingFixturesList } from "../../LightingFixturesList";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { toast } from "sonner";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "functional", label: "Functional" },
  { value: "non_functional", label: "Non-Functional" },
  { value: "maintenance_needed", label: "Needs Maintenance" },
  { value: "pending_maintenance", label: "Pending Maintenance" },
  { value: "scheduled_replacement", label: "Scheduled Replacement" }
];

export function CompactFixturesView() {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { 
    fixtures, 
    isLoading, 
    refetch, 
    handleDelete, 
    handleBulkDelete, 
    handleBulkStatusUpdate 
  } = useLightingFixtures();

  const handleBulkAction = async (action: string) => {
    if (selectedFixtures.length === 0) {
      toast.error("No fixtures selected");
      return;
    }

    try {
      switch (action) {
        case "mark-functional":
          await handleBulkStatusUpdate(selectedFixtures, "functional");
          break;
        case "mark-maintenance":
          await handleBulkStatusUpdate(selectedFixtures, "maintenance_needed");
          break;
        case "mark-broken":
          await handleBulkStatusUpdate(selectedFixtures, "non_functional");
          break;
        case "assign-zone":
          toast.info("Zone assignment feature coming soon");
          break;
        case "delete":
          await handleBulkDelete(selectedFixtures);
          break;
        case "export":
          toast.info("Export feature coming soon");
          break;
        default:
          toast.error("Unknown action");
      }
      
      setSelectedFixtures([]);
    } catch (error) {
      toast.error("Failed to perform bulk action");
    }
  };

  const handleFixtureCreated = () => {
    refetch();
    toast.success("Fixture created successfully");
  };

  return (
    <div className="space-y-6">
      {/* Compact Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search fixtures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          {/* Bulk Actions (only show when fixtures selected) */}
          {selectedFixtures.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Actions ({selectedFixtures.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction("mark-functional")}>
                  Mark as Functional
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("mark-maintenance")}>
                  Mark for Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("mark-broken")}>
                  Mark as Broken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("assign-zone")}>
                  Assign to Zone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleBulkAction("delete")}
                  className="text-destructive"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Add New Button */}
          <CreateLightingDialog 
            onFixtureCreated={handleFixtureCreated}
            onZoneCreated={() => {}}
          />
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{fixtures?.length || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Functional</p>
              <p className="text-lg font-semibold">
                {fixtures?.filter(f => f.status === 'functional').length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Issues</p>
              <p className="text-lg font-semibold">
                {fixtures?.filter(f => f.status !== 'functional').length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="text-lg font-semibold">
                {fixtures?.filter(f => f.status === 'maintenance_needed').length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fixtures List */}
      <LightingFixturesList
        selectedFixtures={selectedFixtures}
        onSelectionChange={setSelectedFixtures}
        statusFilter={statusFilter === "all" ? undefined : statusFilter}
        fixtures={fixtures}
        isLoading={isLoading}
        refetch={refetch}
      />
    </div>
  );
}