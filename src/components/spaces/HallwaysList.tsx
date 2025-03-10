
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { SpaceListFilters } from "./SpaceListFilters";
import { GridView } from "./views/GridView";
import { ListView } from "./views/ListView";
import { TableCell, TableHead } from "@/components/ui/table";
import { useHallwayData } from "./hooks/useHallwayData";
import { ConnectedSpaces } from "./hallway/ConnectedSpaces";
import { filterSpaces, sortSpaces } from "./utils/spaceFilters";
import { Hallway } from "./types/hallwayTypes";
import { Shield, ArrowRight, Accessibility } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface HallwaysListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

const HallwaysList = ({ selectedBuilding, selectedFloor }: HallwaysListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const queryClient = useQueryClient();

  const { hallways, isLoading, deleteHallway } = useHallwayData({
    selectedBuilding,
    selectedFloor
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHallway(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hallways'] });
      toast.success('Hallway deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete hallway');
      console.error('Delete error:', error);
    }
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const filteredAndSortedHallways = useMemo(() => {
    if (!hallways) return [];
    const filtered = filterSpaces(hallways, searchQuery, statusFilter);
    return sortSpaces(filtered, sortBy as any);
  }, [hallways, searchQuery, sortBy, statusFilter]);

  const getAccessibilityColor = (accessibility?: string) => {
    switch (accessibility) {
      case 'fully_accessible': return 'bg-green-500';
      case 'limited_access': return 'bg-yellow-500';
      case 'stairs_only': return 'bg-orange-500';
      case 'restricted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEmergencyRouteColor = (route?: string) => {
    switch (route) {
      case 'primary': return 'bg-red-500';
      case 'secondary': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const renderGridContent = (hallway: Hallway) => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Type: {hallway.type}</p>
      <div className="flex gap-2 items-center">
        <Badge className={getAccessibilityColor(hallway.accessibility)}>
          <Accessibility className="h-3 w-3 mr-1" />
          {hallway.accessibility || 'Not specified'}
        </Badge>
        {hallway.emergency_route !== 'not_designated' && (
          <Badge className={getEmergencyRouteColor(hallway.emergency_route)}>
            <ArrowRight className="h-3 w-3 mr-1" />
            {hallway.emergency_route} route
          </Badge>
        )}
        {hallway.security_level && (
          <Badge variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            {hallway.security_level}
          </Badge>
        )}
      </div>
      {hallway.floors?.buildings?.name && (
        <p className="text-sm text-muted-foreground">
          Building: {hallway.floors.buildings.name}
        </p>
      )}
      {hallway.floors?.name && (
        <p className="text-sm text-muted-foreground">
          Floor: {hallway.floors.name}
        </p>
      )}
      <ConnectedSpaces connections={hallway.space_connections} />
      {hallway.capacity_limit && (
        <p className="text-sm text-muted-foreground">
          Capacity: {hallway.capacity_limit} people
        </p>
      )}
      {hallway.width_meters && hallway.length_meters && (
        <p className="text-sm text-muted-foreground">
          Dimensions: {hallway.width_meters}m × {hallway.length_meters}m
        </p>
      )}
    </div>
  );

  const renderListRow = (hallway: Hallway) => [
    <TableCell key="name">{hallway.name}</TableCell>,
    <TableCell key="type">{hallway.type}</TableCell>,
    <TableCell key="building">{hallway.floors?.buildings?.name}</TableCell>,
    <TableCell key="floor">{hallway.floors?.name}</TableCell>,
    <TableCell key="accessibility">
      <Badge className={getAccessibilityColor(hallway.accessibility)}>
        {hallway.accessibility || 'Not specified'}
      </Badge>
    </TableCell>,
    <TableCell key="status">
      <Badge variant={hallway.status === 'active' ? 'default' : 'destructive'}>
        {hallway.status}
      </Badge>
    </TableCell>
  ];

  return (
    <div className="space-y-6">
      <SpaceListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        view={view}
        onViewChange={setView}
      />

      {isLoading ? (
        <div className="text-center">Loading hallways...</div>
      ) : (
        view === 'grid' ? (
          <GridView
            items={filteredAndSortedHallways}
            renderItem={renderGridContent}
            type="hallway"
            onDelete={handleDelete}
            emptyMessage="No hallways found"
          />
        ) : (
          <ListView
            items={filteredAndSortedHallways}
            renderRow={renderListRow}
            headers={<>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Accessibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </>}
            type="hallway"
            onDelete={handleDelete}
            emptyMessage="No hallways found"
          />
        )
      )}
    </div>
  );
};

export default HallwaysList;
