
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { useHallwayData } from "./hooks/useHallwayData";
import { useState } from "react";
import { SpaceListFilters } from "./SpaceListFilters";
import { EditSpaceDialog } from "./EditSpaceDialog";
import { useSpacesQuery } from "./hooks/queries/useSpacesQuery";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface HallwaysListProps {
  floorId?: string;
}

export function HallwaysList({ floorId }: HallwaysListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { hallways, loading, error } = useHallwayData();
  
  // Handle delete action with confirmation
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this hallway?")) {
      try {
        const { error } = await supabase
          .from("new_spaces")
          .delete()
          .eq("id", id);
          
        if (error) {
          toast.error(`Failed to delete: ${error.message}`);
          throw error;
        }
        
        toast.success("Hallway deleted successfully");
      } catch (error) {
        console.error("Failed to delete hallway:", error);
      }
    }
  };
  
  // Filter hallways by search query and status
  const filteredHallways = hallways.filter((hallway) => {
    const matchesSearch = hallway.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || hallway.status === selectedStatus;
    const matchesFloor = !floorId || hallway.floor_id === floorId;
    return matchesSearch && matchesStatus && matchesFloor;
  });
  
  if (loading) {
    return <div className="text-center py-10">Loading hallways...</div>;
  }
  
  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }
  
  if (filteredHallways.length === 0) {
    return (
      <EmptyState
        title="No hallways found"
        description={searchQuery || selectedStatus !== "all" ? "Try adjusting your filters" : "Create your first hallway to get started"}
        icon={<PlusCircle className="h-10 w-10" />}
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search hallways..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <SpaceListFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHallways.map((hallway) => (
          <Card key={hallway.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{hallway.name}</h3>
                <StatusBadge status={hallway.status} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingId(hallway.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(hallway.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-muted-foreground">
              {hallway.properties?.description && (
                <p className="line-clamp-2">{hallway.properties.description}</p>
              )}
            </div>
            
            <div className="mt-2">
              <div className="text-xs">
                <span className="font-semibold">Floor:</span> {hallway.floors?.name || 'Unknown'}
              </div>
              {hallway.properties?.section && (
                <div className="text-xs">
                  <span className="font-semibold">Section:</span> {hallway.properties.section}
                </div>
              )}
              {hallway.properties?.hallwayType && (
                <div className="text-xs">
                  <span className="font-semibold">Type:</span> {hallway.properties.hallwayType.replace('_', ' ')}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      {editingId && (
        <EditSpaceDialog
          id={editingId}
          type="hallway"
          open={!!editingId}
          onOpenChange={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
