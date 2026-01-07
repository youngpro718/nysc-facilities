import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";

interface ParentRoomHierarchyProps {
  roomId: string;
  showChildren?: boolean;
  showParent?: boolean;
  compact?: boolean;
}

interface RoomHierarchyData {
  id: string;
  name: string;
  room_number: string;
  parent_room_id: string | null;
  // Add all the room properties to match the actual database structure
  capacity?: number;
  capacity_size_category?: string;
  courtroom_photos?: any;
  created_at: string;
  current_function?: string;
  current_occupancy?: number;
  description?: string;
  floor_id: string;
  updated_at: string;
}

export function ParentRoomHierarchy({ 
  roomId, 
  showChildren = true, 
  showParent = true, 
  compact = false 
}: ParentRoomHierarchyProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const handleChildRoomClick = (e: React.MouseEvent, childId: string) => {
    e.stopPropagation();
    e.preventDefault();
    // Preserve ALL existing query params and update room
    const params = new URLSearchParams(searchParams.toString());
    params.set('room', childId);
    navigate(`/spaces?${params.toString()}`);
  };

  const { data: roomData } = useQuery({
    queryKey: ["room-hierarchy", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms') // Use existing table instead of non-existent view
        .select('*')
        .eq('id', roomId)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  const { data: children } = useQuery({
    queryKey: ["room-children", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_child_rooms', { parent_room_id: roomId });
        
      if (error) throw error;
      return data || [];
    },
    enabled: showChildren,
  });

  const { data: parentChain } = useQuery({
    queryKey: ["room-parent-chain", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_parent_chain', { child_room_id: roomId });
        
      if (error) throw error;
      return data || [];
    },
    enabled: showParent && roomData?.parent_room_id !== null,
  });

  if (!roomData) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {/* Only show if room is a child but don't duplicate "sub room" info */}
        {showChildren && children && children.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <Badge variant="secondary" className="text-xs">
              Has sub rooms
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Parent Chain */}
      {showParent && parentChain && parentChain.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Office Suite Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm">
              {parentChain.map((parent: any, index: number) => (
                <div key={parent.parent_id} className="flex items-center gap-2">
                  <span className="font-medium">
                    {parent.parent_room_number} - {parent.parent_name}
                  </span>
                  {index < parentChain.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline">Current Room</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub rooms */}
      {showChildren && children && children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sub rooms ({children.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {children.map((child: any) => (
                <button
                  key={child.child_id}
                  onClick={(e) => handleChildRoomClick(e, child.child_id)}
                  className="w-full flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {child.child_room_number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {child.child_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {child.depth > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Level {child.depth}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}