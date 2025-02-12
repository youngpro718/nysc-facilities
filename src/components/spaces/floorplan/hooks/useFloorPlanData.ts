import { useEffect, useState } from 'react';
import { Edge } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Position, Size, FloorPlanObjectType } from '../types/floorPlanTypes';

interface FloorPlanObject {
  id: string;
  type: FloorPlanObjectType;
  position?: Position;
  parent_room_id?: string;
  has_children?: boolean;
  data?: {
    label?: string;
    type?: FloorPlanObjectType;
    size?: Size;
    style?: Record<string, any>;
    properties?: Record<string, any>;
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
  if (typeof position === 'object' && position !== null) {
    const x = (position as any).x;
    const y = (position as any).y;
    if (typeof x === 'number' && typeof y === 'number') {
      return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

function parseJsonSize(size: Json): Size {
  if (typeof size === 'object' && size !== null) {
    const width = (size as any).width;
    const height = (size as any).height;
    if (typeof width === 'number' && typeof height === 'number') {
      return { width, height };
    }
  }
  return { width: 150, height: 100 };
}

export function useFloorPlanData(floorId: string | null) {
  const [objects, setObjects] = useState<FloorPlanObject[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!floorId) {
      setObjects([]);
      setEdges([]);
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .eq('floor_id', floorId);

        if (roomsError) throw roomsError;

        // Fetch hallways
        const { data: hallwaysData, error: hallwaysError } = await supabase
          .from('hallways')
          .select('*')
          .eq('floor_id', floorId);

        if (hallwaysError) throw hallwaysError;

        // Process rooms
        const rooms = (roomsData as RawRoomData[]).map(room => ({
          id: room.id,
          type: 'room' as FloorPlanObjectType,
          position: parseJsonPosition(room.position),
          parent_room_id: room.parent_room_id,
          has_children: false, // Will be updated after processing all rooms
          data: {
            label: room.name,
            type: 'room' as FloorPlanObjectType,
            size: parseJsonSize(room.size),
            style: {},
            properties: {
              status: room.status,
              current_function: room.current_function
            }
          }
        }));

        // Update has_children flag
        rooms.forEach(room => {
          if (room.parent_room_id) {
            const parentRoom = rooms.find(r => r.id === room.parent_room_id);
            if (parentRoom) {
              parentRoom.has_children = true;
            }
          }
        });

        // Process hallways
        const hallways = (hallwaysData as RawHallwayData[]).map(hallway => ({
          id: hallway.id,
          type: 'hallway' as FloorPlanObjectType,
          position: parseJsonPosition(hallway.position),
          data: {
            label: hallway.name,
            type: 'hallway' as FloorPlanObjectType,
            size: parseJsonSize(hallway.size),
            style: {},
            properties: {
              status: hallway.status
            }
          }
        }));

        setObjects([...rooms, ...hallways]);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching floor plan data:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, [floorId]);

  return { objects, edges, isLoading, error };
}
