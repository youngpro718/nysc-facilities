
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { transformSpaceToNode } from "../utils/nodeTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, FloorPlanNode } from "../types/floorPlanTypes";

export function useFloorPlanData(floorId: string | null) {
  // Query for layers
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const data = await fetchFloorPlanLayers(floorId);
      return Array.isArray(data) ? data.map(layer => transformLayer(layer as FloorPlanLayerDB)) : [];
    },
    enabled: !!floorId
  });

  // Query for floor plan objects and connections
  const { data: spaceData, isLoading: isLoadingObjects, error } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], connections: [] };
      console.log('Fetching floor plan objects for floor:', floorId);
      return fetchFloorPlanObjects(floorId);
    },
    enabled: !!floorId
  });

  // Ensure spaceData is properly structured to avoid "undefined" errors
  const safeSpaceData = spaceData || { objects: [], connections: [] };
  
  // Transform all objects into floor plan nodes with safety checks
  const objects: FloorPlanNode[] = Array.isArray(safeSpaceData.objects) 
    ? safeSpaceData.objects
        .filter(obj => obj && typeof obj === 'object') // Filter out null/undefined objects
        .map((obj, index) => {
          try {
            return transformSpaceToNode(obj, index);
          } catch (error) {
            console.error(`Error transforming space object:`, obj, error);
            return null;
          }
        })
        .filter(Boolean) as FloorPlanNode[] // Filter out any nulls from failed transformations
    : [];
    
  const edges = Array.isArray(safeSpaceData.connections) 
    ? createEdgesFromConnections(
        safeSpaceData.connections.filter(conn => conn && typeof conn === 'object')
      ) 
    : [];
  
  // Process parent/child relationships
  const processedObjects = objects.map(obj => {
    if (!obj || !obj.data || !obj.data.properties) return obj;
    
    try {
      if (obj.data.properties.parent_room_id) {
        const parentObj = objects.find(parent => parent && parent.id === obj.data.properties.parent_room_id);
        if (parentObj && parentObj.position) {
          // Adjust position relative to parent
          obj.position = {
            x: parentObj.position.x + 50,
            y: parentObj.position.y + 50
          };
        }
      }
    } catch (error) {
      console.error('Error processing parent/child relationship for object:', obj.id, error);
    }
    return obj;
  });

  return {
    layers: layers || [],
    objects: processedObjects.filter(obj => obj && obj.position && !isNaN(obj.position.x) && !isNaN(obj.position.y)),
    edges,
    isLoading: isLoadingLayers || isLoadingObjects,
    error // Include error in the return value
  };
}
