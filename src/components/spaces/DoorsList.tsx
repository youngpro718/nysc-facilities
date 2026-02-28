
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { SpaceListFilters } from "./SpaceListFilters";
import { useState, useMemo } from "react";
import { filterSpaces, sortSpaces } from "./utils/spaceFilters";
import { GridView } from "./views/GridView";
import { ListView } from "./views/ListView";
import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { AlertTriangle, Wrench, ArrowLeftRight } from "lucide-react";


type Door = {
  id: string;
  name: string;
  type: "standard" | "emergency" | "secure" | "maintenance";
  status: string;
  floor: { id: string; } | null;
  floor_id: string;
  created_at: string;
  updated_at: string;
  is_transition_door: boolean;
  has_closing_issue: boolean;
  has_handle_issue: boolean;
  issue_notes: string | null;
};

const DoorsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  

  const { data: doors, isLoading } = useQuery({
    queryKey: ['doors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doors')
        .select(`
          *,
          floor:floors!inner(*)
        `)
        .order('name');
      if (error) throw error;
      return data as Door[];
    },
  });

  const groupedDoors = useMemo(() => {
    if (!doors) return { transition: [], problem: [], standard: [] };
    
    return doors.reduce((acc, door) => {
      if (door.is_transition_door) {
        acc.transition.push(door);
      } else if (door.has_closing_issue || door.has_handle_issue) {
        acc.problem.push(door);
      } else {
        acc.standard.push(door);
      }
      return acc;
    }, { transition: [], problem: [], standard: [] } as Record<string, Door[]>);
  }, [doors]);

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
      logger.error('Error deleting door:', error);
    },
  });

  const renderDoorContent = (door: Door) => (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {door.is_transition_door && (
            <ArrowLeftRight className="h-4 w-4 text-blue-500" />
          )}
          {(door.has_closing_issue || door.has_handle_issue) && (
            <Wrench className="h-4 w-4 text-yellow-500" />
          )}
          {door.type === 'emergency' && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          <p className="text-sm text-muted-foreground">Type: {door.type}</p>
        </div>
        
        {door.is_transition_door && (
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30">
            Transition Door
          </Badge>
        )}

        {(door.has_closing_issue || door.has_handle_issue) && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Issues:</p>
            {door.has_closing_issue && (
              <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30">
                Closing Issue
              </Badge>
            )}
            {door.has_handle_issue && (
              <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30">
                Handle Issue
              </Badge>
            )}
          </div>
        )}

        {door.issue_notes && (
          <p className="text-sm text-muted-foreground mt-2">
            Notes: {door.issue_notes}
          </p>
        )}
      </div>
    </>
  );

  const renderDoorRow = (door: Door) => [
    <TableCell key="name">{door.name}</TableCell>,
    <TableCell key="type" className="flex items-center gap-2">
      {door.is_transition_door && <ArrowLeftRight className="h-4 w-4 text-blue-500" />}
      {(door.has_closing_issue || door.has_handle_issue) && <Wrench className="h-4 w-4 text-yellow-500" />}
      {door.type}
    </TableCell>,
    <TableCell key="status">
      <Badge variant={door.status === 'active' ? 'default' : 'destructive'}>
        {door.status}
      </Badge>
    </TableCell>,
    <TableCell key="issues">
      {(door.has_closing_issue || door.has_handle_issue) ? (
        <div className="space-x-2">
          {door.has_closing_issue && <Badge variant="outline">Closing</Badge>}
          {door.has_handle_issue && <Badge variant="outline">Handle</Badge>}
        </div>
      ) : (
        <span className="text-muted-foreground">No issues</span>
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
      />

      {isLoading ? (
        <div className="text-center py-4">Loading doors...</div>
      ) : (
        <>
          {groupedDoors.transition.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transition Doors</h3>
              <GridView
                items={groupedDoors.transition}
                onDelete={(id) => deleteDoor.mutate(id)}
                renderItemContent={renderDoorContent}
                type="door"
              />
            </div>
          )}

          {groupedDoors.problem.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold">Problem Doors</h3>
              <GridView
                items={groupedDoors.problem}
                onDelete={(id) => deleteDoor.mutate(id)}
                renderItemContent={renderDoorContent}
                type="door"
              />
            </div>
          )}

          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-semibold">Standard Doors</h3>
            <GridView
              items={groupedDoors.standard}
              onDelete={(id) => deleteDoor.mutate(id)}
              renderItemContent={renderDoorContent}
              type="door"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DoorsList;
