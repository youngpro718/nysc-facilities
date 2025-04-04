
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ViewToggle } from "./ViewToggle";
import { CreateSpaceDialog } from "./CreateSpaceDialog";
import { EditSpaceDialog } from "./EditSpaceDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusEnum } from "./rooms/types/roomEnums";
import { SpaceListFilters } from "./SpaceListFilters";
import { ScrollArea } from "@/components/ui/scroll-area";

export const SpacesList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: spaces, isLoading, refetch } = useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const { data: spacesData, error: spacesError } = await supabase
        .from('rooms')
        .select(`
          *,
          floors (
            name,
            buildings (
              name
            )
          ),
          issues (
            id,
            status,
            photos
          )
        `);

      if (spacesError) {
        toast.error(spacesError.message);
        throw spacesError;
      }

      return spacesData;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="space-y-6 flex-none">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Spaces</h1>
          <div className="flex items-center gap-4">
            <ViewToggle 
              view={view} 
              onViewChange={setView}
            />
            <CreateSpaceDialog />
          </div>
        </div>

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
      </div>

      <ScrollArea className="flex-grow mt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-1">
          {spaces?.map((space: any) => (
            <div key={space.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{space.name}</h3>
                <Badge variant={space.status === StatusEnum.ACTIVE ? 'default' : 'destructive'}>
                  {space.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {space.floors?.buildings?.name} &gt; {space.floors?.name}
              </p>
              <div className="flex items-center gap-2">
                <EditSpaceDialog 
                  id={space.id}
                  type="room"
                  initialData={{
                    id: space.id,
                    name: space.name,
                    status: space.status as StatusEnum,
                    floorId: space.floor_id,
                  }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('rooms')
                        .delete()
                        .eq('id', space.id);
                      
                      if (error) throw error;
                      
                      toast.success("Space deleted successfully");
                      refetch();
                    } catch (error: any) {
                      toast.error(error.message);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
