
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { SpaceListFilters } from "./SpaceListFilters";
import { GridView } from "./views/GridView";
import { ListView } from "./views/ListView";
import { TableCell } from "@/components/ui/table";
import { useHallwayData } from "./hooks/useHallwayData";
import { ConnectedSpaces } from "./hallway/ConnectedSpaces";
import { filterSpaces, sortSpaces } from "./utils/spaceFilters";
import { Hallway } from "./types/hallwayTypes";
import { Shield, ArrowRight, Accessibility } from "lucide-react";

interface HallwaysListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

const HallwaysList = ({ selectedBuilding, selectedFloor }: HallwaysListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { hallways, isLoading, deleteHallway } = useHallwayData({
    selectedBuilding,
    selectedFloor
  });

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

  const renderGridContent = (hallway: any) => (
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

  const renderListRow = (hallway: any) => [
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
            onDelete={(id) => deleteHallway.mutate(id)}
            renderItemContent={renderGridContent}
            type="hallway"
          />
        ) : (
          <ListView
            items={filteredAndSortedHallways}
            onDelete={(id) => deleteHallway.mutate(id)}
            renderRow={renderListRow}
            type="hallway"
          />
        )
      )}
    </div>
  );
};

export default HallwaysList;
