import { useEffect, useState } from 'react';
import { Edge } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface FloorPlanObject {
  id: string;
  type: string;
  position?: Position;
  parent_room_id?: string;
  has_children?: boolean;
  data?: {
    label?: string;
    type?: string;
    size?: Size;
    style?: any;
    properties?: any;
  };
}

interface RoomData {
  id: string;
  name: string;
  position: Position;
  size: Size;
  parent_room_id: string | null;
  status: 'active' | 'inactive' | 'under_maintenance';
  current_function: string;
}

interface HallwayData {
  id: string;
  name: string;
  position: Position;
  size: Size;
  status: 'active' | 'inactive' | 'under_maintenance';
}

interface RawRoomData {
  id: string;
  name: string;
  position: Json;
  size: Json;
  parent_room_id: string | null;
  status: 'active' | 'inactive' | 'under_maintenance';
  current_function: string;
}

interface RawHallwayData {
  id: string;
  name: string;
  position: Json;
  size: Json;
  status: 'active' | 'inactive' | 'under_maintenance';
}

function parseJsonPosition(position: Json): Position {
  if (typeof position === 'object' && position !== null && 'x' in position && 'y' in position) {
    return {
      x: Number(position.x),
      y: Number(position.y)
    };
  }
  console.warn('Invalid position data:', position);
  return { x: 0, y: 0 };
}

function parseJsonSize(size: Json): Size {
  if (typeof size === 'object' && size !== null && 'width' in size && 'height' in size) {
    return {
      width: Number(size.width),
      height: Number(size.height)
    };
  }
  console.warn('Invalid size data:', size);
  return { width: 100, height: 50 };
}

export function useFloorPlanData(floorId: string | null) {
  const [objects, setObjects] = useState<FloorPlanObject[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!floorId) {
      setObjects([]);
      setEdges([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // First fetch all rooms on this floor
        const { data: rawRooms, error: roomsError } = await supabase
          .from('rooms')
          .select('id, name, position, size, parent_room_id, status, current_function')
          .eq('floor_id', floorId);

        if (roomsError) throw roomsError;

        // Then fetch all hallways on this floor
        const { data: rawHallways, error: hallwaysError } = await supabase
          .from('hallways')
          .select('id, name, position, size, status')
          .eq('floor_id', floorId);

        if (hallwaysError) throw hallwaysError;

        // Process rooms to identify parent-child relationships
        const roomMap = new Map<string, FloorPlanObject>();
        const roomChildren = new Map<string, string[]>();

        // First pass: create room map and track children
        const rooms = (rawRooms as RawRoomData[])?.map(room => ({
          ...room,
          position: parseJsonPosition(room.position),
          size: parseJsonSize(room.size)
        }));

        rooms?.forEach(room => {
          roomMap.set(room.id, {
            id: room.id,
            type: 'room',
            position: room.position,
            parent_room_id: room.parent_room_id || undefined,
            data: {
              label: room.name || room.current_function,
              type: 'room',
              size: room.size,
              properties: {
                room_type: room.current_function,
                status: room.status
              }
            }
          });

          if (room.parent_room_id) {
            const children = roomChildren.get(room.parent_room_id) || [];
            children.push(room.id);
            roomChildren.set(room.parent_room_id, children);
          }
        });

        // Second pass: mark rooms with children
        roomChildren.forEach((children, parentId) => {
          const parent = roomMap.get(parentId);
          if (parent) {
            parent.has_children = true;
          }
        });

        // Convert hallways to objects (without parent-child relationships)
        const hallways = (rawHallways as RawHallwayData[])?.map(hallway => ({
          ...hallway,
          position: parseJsonPosition(hallway.position),
          size: parseJsonSize(hallway.size)
        }));

        const hallwayObjects = hallways?.map(hallway => ({
          id: hallway.id,
          type: 'hallway',
          position: hallway.position,
          data: {
            label: hallway.name || 'Hallway',
            type: 'hallway',
            size: hallway.size,
            properties: {
              status: hallway.status
            }
          }
        })) || [];

        // Combine rooms and hallways
        const allObjects = [...Array.from(roomMap.values()), ...hallwayObjects];
        
        console.log('Transformed objects:', allObjects);
        setObjects(allObjects);

        // Create edges for parent-child relationships (rooms only)
        const relationshipEdges: Edge[] = Array.from(roomMap.values())
          .filter(obj => obj.parent_room_id)
          .map(obj => ({
            id: `${obj.parent_room_id}-${obj.id}`,
            source: obj.parent_room_id,
            target: obj.id,
            type: 'straight',
            style: { stroke: '#94a3b8', strokeWidth: 1, opacity: 0.5 },
            zIndex: -1
          }));

        console.log('Created edges:', relationshipEdges);
        setEdges(relationshipEdges);
        
      } catch (error) {
        console.error('Error fetching floor plan data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [floorId]);

  return { objects, edges, isLoading };
}
