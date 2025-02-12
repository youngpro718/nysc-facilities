import { useEffect, useState } from 'react';
import { Edge } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Position, Size, FloorPlanObject, RoomData, HallwayData } from '../types/floorPlanTypes';

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

    const loadData = async () => {
      try {
        const [roomsResult, hallwaysResult, edgesResult] = await Promise.all([
          supabase
            .from('rooms')
            .select('*')
            .eq('floor_id', floorId),
          supabase
            .from('hallways')
            .select('*')
            .eq('floor_id', floorId),
          supabase
            .from('floor_plan_edges')
            .select('*')
            .eq('floor_id', floorId)
        ]);

        if (roomsResult.error) throw roomsResult.error;
        if (hallwaysResult.error) throw hallwaysResult.error;
        if (edgesResult.error) throw edgesResult.error;

        const rooms = roomsResult.data.map((room): FloorPlanObject => ({
          id: room.id,
          type: 'room',
          position: parseJsonPosition(room.position),
          parent_room_id: room.parent_room_id,
          has_children: room.has_children,
          data: {
            label: room.name,
            type: 'room',
            size: parseJsonSize(room.size),
            style: room.style || {},
            properties: {
              status: room.status,
              current_function: room.current_function
            }
          }
        }));

        const hallways = hallwaysResult.data.map((hallway): FloorPlanObject => ({
          id: hallway.id,
          type: 'hallway',
          position: parseJsonPosition(hallway.position),
          data: {
            label: hallway.name,
            type: 'hallway',
            size: parseJsonSize(hallway.size),
            style: hallway.style || {},
            properties: {
              status: hallway.status,
              accessibility: hallway.accessibility
            }
          }
        }));

        const edges = edgesResult.data.map((edge): Edge => ({
          id: edge.id,
          source: edge.source_id,
          target: edge.target_id,
          type: edge.type || 'default',
          animated: edge.animated || false,
          style: edge.style || {}
        }));

        setObjects([...rooms, ...hallways]);
        setEdges(edges);
      } catch (error) {
        console.error('Error loading floor plan data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [floorId]);

  return { objects, edges, isLoading };
}
