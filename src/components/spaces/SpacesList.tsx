import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SpaceListFilters } from "./SpaceListFilters";
import { ViewToggle } from "./ViewToggle";
import { CreateSpaceDialog } from "./CreateSpaceDialog";
import { EditSpaceDialog } from "./EditSpaceDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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

  const getSpaceImage = (space: any) => {
    const activeIssue = space.issues?.find(
      (issue: any) => 
        issue.status !== 'resolved' && 
        issue.photos && 
        issue.photos.length > 0
    );

    if (activeIssue?.photos?.[0]) {
      return activeIssue.photos[0];
    }

    return '/placeholder.svg';
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {spaces?.map((space: any) => (
          <Card key={space.id} className="overflow-hidden">
            <AspectRatio ratio={16/9}>
              <img
                src={getSpaceImage(space)}
                alt={space.name}
                className="object-cover w-full h-full"
              />
            </AspectRatio>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{space.name}</h3>
                <Badge variant={space.status === 'active' ? 'default' : 'destructive'}>
                  {space.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {space.floors?.buildings?.name} &gt; {space.floors?.name}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <EditSpaceDialog 
                  id={space.id}
                  type="room"
                  initialData={{
                    name: space.name,
                    type: "room",
                    status: space.status,
                    floorId: space.floor_id,
                    roomNumber: space.room_number,
                    roomType: space.room_type,
                    description: space.description,
                    isStorage: space.is_storage,
                    storageCapacity: space.storage_capacity,
                    storageType: space.storage_type,
                    storageNotes: space.storage_notes,
                    phoneNumber: space.phone_number,
                    parentRoomId: space.parent_room_id,
                    currentFunction: space.current_function
                  }}
                />
                <Button
                  variant="outline"
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
