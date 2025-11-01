import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, Users, Home, TreePine } from "lucide-react";

interface HierarchyFiltersProps {
  showOnlyParents: boolean;
  onShowOnlyParentsChange: (value: boolean) => void;
  showOnlyChildren: boolean;
  onShowOnlyChildrenChange: (value: boolean) => void;
  groupByParent: boolean;
  onGroupByParentChange: (value: boolean) => void;
  hierarchyStats: {
    totalRooms: number;
    parentRooms: number;
    childRooms: number;
    orphanRooms: number;
  };
}

export function HierarchyFilters({
  showOnlyParents,
  onShowOnlyParentsChange,
  showOnlyChildren,
  onShowOnlyChildrenChange,
  groupByParent,
  onGroupByParentChange,
  hierarchyStats,
}: HierarchyFiltersProps) {
  const handleClearFilters = () => {
    onShowOnlyParentsChange(false);
    onShowOnlyChildrenChange(false);
    onGroupByParentChange(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TreePine className="h-4 w-4" />
          Room Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Hierarchy Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <Badge variant="secondary">{hierarchyStats.totalRooms}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Office Suites:</span>
            <Badge variant="secondary">{hierarchyStats.parentRooms}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Sub rooms:</span>
            <Badge variant="secondary">{hierarchyStats.childRooms}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Standalone:</span>
            <Badge variant="secondary">{hierarchyStats.orphanRooms}</Badge>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-parents" className="text-sm">
              Show only office suites
            </Label>
            <Switch
              id="show-parents"
              checked={showOnlyParents}
              onCheckedChange={onShowOnlyParentsChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-children" className="text-sm">
              Show only sub rooms
            </Label>
            <Switch
              id="show-children"
              checked={showOnlyChildren}
              onCheckedChange={onShowOnlyChildrenChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="group-by-parent" className="text-sm">
              Group by office suite
            </Label>
            <Switch
              id="group-by-parent"
              checked={groupByParent}
              onCheckedChange={onGroupByParentChange}
            />
          </div>

          {(showOnlyParents || showOnlyChildren || groupByParent) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="w-full mt-2"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}