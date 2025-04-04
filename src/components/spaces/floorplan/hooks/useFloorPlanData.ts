
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { transformLayer } from '../utils/layerTransforms';
import { FloorPlanLayer, FloorPlanLayerDB, FloorPlanNode } from '../types/floorPlanTypes';

export const useFloorPlanData = (floorId: string, previewData?: any) => {
  // Query to fetch layers
  const layersQuery = useQuery({
    queryKey: ['floorplan', 'layers', floorId],
    queryFn: async () => {
      if (!floorId || floorId === 'all') {
        return [];
      }

      const { data, error } = await supabase
        .from('floor_layers')
        .select('*')
        .eq('floor_id', floorId)
        .order('order_index', { ascending: true });

      if (error) throw new Error(`Failed to fetch floor layers: ${error.message}`);

      return (data || []).map((rawLayer: any) => transformLayer(rawLayer as FloorPlanLayerDB));
    },
    enabled: !!floorId && floorId !== 'all',
  });

  // Query to fetch spaces (nodes)
  const spacesQuery = useQuery({
    queryKey: ['floorplan', 'nodes', floorId],
    queryFn: async () => {
      if (!floorId || floorId === 'all') {
        return [];
      }

      const { data, error } = await supabase
        .from('spaces')
        .select(`
          id,
          name,
          type,
          floor_id,
          properties,
          position,
          size,
          status,
          rotation
        `)
        .eq('floor_id', floorId);

      if (error) throw new Error(`Failed to fetch floor spaces: ${error.message}`);

      // Process the spaces into nodes
      const nodes: FloorPlanNode[] = (data || []).map((space, index) => {
        // Convert the space object to a FloorPlanNode
        const position = typeof space.position === 'string' 
          ? JSON.parse(space.position) 
          : (space.position || { x: 0, y: 0 });
          
        const size = typeof space.size === 'string'
          ? JSON.parse(space.size)
          : (space.size || { width: 150, height: 100 });
          
        const properties = typeof space.properties === 'string'
          ? JSON.parse(space.properties)
          : (space.properties || {});

        // Get color based on type
        let backgroundColor = '#e2e8f0';
        if (space.type === 'room') {
          backgroundColor = '#c7d5ed';
        } else if (space.type === 'hallway') {
          backgroundColor = '#e5e7eb';
        } else if (space.type === 'door') {
          backgroundColor = '#94a3b8';
        }

        return {
          id: space.id,
          type: space.type,
          position,
          data: {
            label: space.name,
            type: space.type,
            size,
            style: {
              backgroundColor,
              border: space.status === 'active' ? '1px solid #cbd5e1' : '2px dashed #ef4444',
              opacity: space.status === 'active' ? 1 : 0.7
            },
            properties,
            rotation: space.rotation || 0
          },
          zIndex: space.type === 'door' ? 2 : space.type === 'hallway' ? 1 : 0
        };
      });

      return nodes;
    },
    enabled: !!floorId && floorId !== 'all',
  });

  return {
    layers: layersQuery.data || [],
    spaces: spacesQuery.data || [],
    isLoading: layersQuery.isLoading || spacesQuery.isLoading,
    isError: layersQuery.isError || spacesQuery.isError,
    error: layersQuery.error || spacesQuery.error,
  };
};

export default useFloorPlanData;
