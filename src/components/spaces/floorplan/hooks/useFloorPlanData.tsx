
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { FloorPlanLayerDB, FloorPlanNode, FloorPlanEdge } from "../types/floorPlanTypes";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export function useFloorPlanData(floorId: string | null) {
  // Query for layers
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const { data, error } = await supabase
        .from('floorplan_layers')
        .select('*')
        .eq('floor_id', floorId);
      
      if (error) throw error;
      return data.map(layer => transformLayer(layer as FloorPlanLayerDB));
    },
    enabled: !!floorId
  });

  // Query for floor plan objects and connections
  const { data: objectsData, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], edges: [] };
      
      logger.debug('Fetching floor plan objects for floor:', floorId);
      
      const { data: floorObjects, error } = await supabase
        .from('floor_plan_objects')
        .select('*')
        .eq('floor_id', floorId);

      if (error) {
        logger.error('Error fetching floor plan objects:', error);
        throw error;
      }

      logger.debug('Retrieved floor objects:', floorObjects);

      // Transform the objects to match our FloorPlanNode type
      const rawNodes: FloorPlanNode[] = (floorObjects || []).map(obj => ({
        id: obj.id,
        type: obj.type,
        position: obj.position || { x: 0, y: 0 },
        data: {
          label: obj.label || '',
          type: obj.type,
          size: obj.size || { width: obj.type === 'door' ? 60 : 150, height: obj.type === 'door' ? 20 : 100 },
          style: obj.style || {
            backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
            border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
          },
          properties: obj.properties || {},
          rotation: obj.rotation || 0
        },
        rotation: obj.rotation || 0,
        zIndex: obj.z_index || 0
      }));

      // Auto-layout: arrange rooms at {0,0} in a grid so they don't stack
      const unpositioned = rawNodes.filter(n => {
        const p = n.position as any;
        return (!p || (p.x === 0 && p.y === 0)) && n.type !== 'door';
      });
      const positioned = rawNodes.filter(n => {
        const p = n.position as any;
        return (p && (p.x !== 0 || p.y !== 0)) || n.type === 'door';
      });

      // Find max extent of positioned rooms to place grid after them
      let offsetX = 0;
      let offsetY = 0;
      positioned.forEach(n => {
        const p = n.position as any;
        const s = (n.data as any)?.size;
        const w = s?.width || 150;
        offsetX = Math.max(offsetX, (p?.x || 0) + w);
        offsetY = Math.max(offsetY, (p?.y || 0) + (s?.height || 100));
      });

      // Place unpositioned rooms in a grid with 180px spacing
      const cols = Math.max(1, Math.ceil(Math.sqrt(unpositioned.length)));
      const spacingX = 200;
      const spacingY = 160;
      const gridStartX = positioned.length > 0 ? offsetX + 250 : 100;
      const gridStartY = 100;

      unpositioned.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        (node as any).position = {
          x: gridStartX + col * spacingX,
          y: gridStartY + row * spacingY
        };
      });

      const nodes = [...positioned, ...unpositioned];

      logger.debug('Transformed nodes:', nodes);

      return {
        objects: nodes,
        edges: [] as FloorPlanEdge[]
      };
    },
    enabled: !!floorId
  });

  return {
    layers: layers || [],
    objects: objectsData?.objects || [],
    edges: objectsData?.edges || [],
    isLoading: isLoadingLayers || isLoadingObjects
  };
}
