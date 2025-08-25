import { LightingFixturesList } from "@/components/lighting/LightingFixturesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Filter, 
  MoreHorizontal,
  Settings,
  Trash2,
  Wrench,
  CheckCircle
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

  const handleBulkAction = (action: string) => {
    if (selectedFixtures.length === 0) {
      toast.error("Please select fixtures to perform bulk actions");
      return;
    }

    switch (action) {
      case 'maintenance':
        toast.success(`Scheduled maintenance for ${selectedFixtures.length} fixtures`);
        break;
      case 'status_update':
        toast.success(`Updated status for ${selectedFixtures.length} fixtures`);
        break;
      case 'delete':
        toast.success(`Deleted ${selectedFixtures.length} fixtures`);
        break;
      case 'export':
        toast.success("Exporting fixture data...");
        // Implement CSV export logic here
        break;
      default:
        toast.info(`Action: ${action}`);
    }
    setSelectedFixtures([]);
  };

  const handleSettings = () => {
    toast.info("Opening fixture management settings...");
    // TODO: Implement settings modal
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fixture Management</CardTitle>
            <div className="flex items-center gap-2">
              {selectedFixtures.length > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {selectedFixtures.length} selected
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('maintenance')}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Schedule Maintenance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('status_update')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Status
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
                onClick={handleSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage lighting fixtures across all rooms and floors. Use bulk actions for efficient maintenance scheduling.
          </p>
        </CardContent>
      </Card>

      {/* Fixtures List */}
      <LightingFixturesList />
    </div>
  );
}