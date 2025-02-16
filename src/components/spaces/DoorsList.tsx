
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpaceListFilters } from "./SpaceListFilters";
import { useState, useMemo } from "react";
import { filterSpaces, sortSpaces } from "./utils/spaceFilters";
import { GridView } from "./views/GridView";
import { ListView } from "./views/ListView";
import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { Clock, Lock, AlertTriangle } from "lucide-react";

interface DoorsListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

type Door = {
  id: string;
  name: string;
  type: "standard" | "emergency" | "secure" | "maintenance";
  status: string;
  security_level: string;
  floor: { id: string; } | null;
  floor_id: string;
  created_at: string;
  updated_at: string;
  passkey_enabled: boolean;
  next_maintenance_date: string | null;
  last_maintenance_date: string | null;
  maintenance_history: any[];
  status_history: any[];
  security_config: {
    access_levels: string[];
    restricted_times: any[];
    emergency_contacts: any[];
    emergency_override: boolean;
  };
}

const DoorsList = ({ selectedBuilding, selectedFloor }: DoorsListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: doors, isLoading } = useQuery({
    queryKey: ['doors', selectedFloor],
    queryFn: async () => {
      let query = supabase
        .from('doors')
        .select('*, floor:floors!inner(id)');

      if (selectedFloor !== 'all') {
        query = query.eq('floor_id', selectedFloor);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching doors:', error);
        throw error;
      }

      return data.map((door: any) => ({
        ...door,
        floor_id: door.floor?.id
      })) as Door[];
    },
    enabled: true
  });

  const filteredDoors = useMemo(() => 
    filterSpaces(doors, searchQuery, statusFilter),
    [doors, searchQuery, statusFilter]
  );

  const sortedDoors = useMemo(() => 
    sortSpaces(filteredDoors, sortBy as any),
    [filteredDoors, sortBy]
  );

  const deleteDoor = useMutation({
    mutationFn: async (doorId: string) => {
      const { error } = await supabase
        .from('doors')
        .delete()
        .eq('id', doorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doors'] });
      toast({
        title: "Door deleted",
        description: "The door has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete door. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting door:', error);
    },
  });

  const renderDoorContent = (door: Door) => (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {door.type === 'secure' && <Lock className="h-4 w-4 text-yellow-500" />}
          {door.type === 'emergency' && <AlertTriangle className="h-4 w-4 text-red-500" />}
          <p className="text-sm text-muted-foreground">Type: {door.type}</p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Security Level: {door.security_level}
        </p>
        
        {door.passkey_enabled && (
          <Badge variant="outline" className="text-xs">
            Passkey Enabled
          </Badge>
        )}

        {door.next_maintenance_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Next Maintenance: {format(new Date(door.next_maintenance_date), "PPP")}
          </div>
        )}

        {door.security_config?.access_levels?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium">Access Levels:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {door.security_config.access_levels.map((level) => (
                <Badge key={level} variant="secondary" className="text-xs">
                  {level}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderDoorRow = (door: Door) => [
    <TableCell key="name">{door.name}</TableCell>,
    <TableCell key="type" className="flex items-center gap-2">
      {door.type === 'secure' && <Lock className="h-4 w-4 text-yellow-500" />}
      {door.type === 'emergency' && <AlertTriangle className="h-4 w-4 text-red-500" />}
      {door.type}
    </TableCell>,
    <TableCell key="security">{door.security_level}</TableCell>,
    <TableCell key="status">
      <Badge variant={door.status === 'active' ? 'default' : 'destructive'}>
        {door.status}
      </Badge>
    </TableCell>,
    <TableCell key="maintenance">
      {door.next_maintenance_date ? (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {format(new Date(door.next_maintenance_date), "PPP")}
        </div>
      ) : (
        "Not scheduled"
      )}
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

      {isLoading ? null : (
        view === 'grid' ? (
          <GridView
            items={sortedDoors}
            onDelete={(id) => deleteDoor.mutate(id)}
            renderItemContent={renderDoorContent}
            type="door"
          />
        ) : (
          <ListView
            items={sortedDoors}
            onDelete={(id) => deleteDoor.mutate(id)}
            renderRow={renderDoorRow}
            type="door"
          />
        )
      )}
    </div>
  );
};

export default DoorsList;
