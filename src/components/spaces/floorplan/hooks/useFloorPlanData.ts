
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { transformSpaceToNode } from "../utils/nodeTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB } from "../types/floorPlanTypes";

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
  
  // Assign default positions to objects without positions
  // This is crucial for the 3D view to show objects
  const objectsWithPositions = Array.isArray(safeSpaceData.objects) ? 
    safeSpaceData.objects.map((obj, index) => {
      // If object has no position, assign a grid position
      if (!obj.position || (obj.position.x === 0 && obj.position.y === 0)) {
        // Calculate grid position - create a grid layout
        const gridSize = 250; // Space between objects
        const gridCols = 4; // Number of columns in the grid
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        
        return {
          ...obj,
          position: {
            x: col * gridSize + 100, // Add offset to avoid starting at 0,0
            y: row * gridSize + 100
          }
        };
      }
      return obj;
    }) : 
    [];
  
  // Transform all objects into floor plan nodes
  const objects = objectsWithPositions.map((obj, index) => {
    // Ensure each object has the required properties
    try {
      // Set default size if missing or invalid
      if (!obj.size || obj.size.width <= 0 || obj.size.height <= 0) {
        obj.size = { width: 150, height: 100 };
      }
      
      return transformSpaceToNode(obj, index);
    } catch (error) {
      console.error('Error transforming object to node:', error, obj);
      // Return a fallback node in case of errors
      return {
        id: obj.id || `error-${index}`,
        type: obj.object_type || 'room',
        position: { x: obj.position?.x || index * 100, y: obj.position?.y || index * 100 },
        data: {
          label: obj.name || 'Error Object',
          type: obj.object_type || 'room',
          size: obj.size || { width: 150, height: 100 },
          style: {
            backgroundColor: '#f87171',
            border: '1px dashed #ef4444',
            opacity: 0.7
          },
          properties: obj.properties || {}
        },
        zIndex: 0
      };
    }
  });
    
  const edges = Array.isArray(safeSpaceData.connections) ? 
    createEdgesFromConnections(safeSpaceData.connections) : 
    [];
  
  console.log('Transformed objects:', objects);
  console.log('Created edges:', edges);

  // Process parent/child relationships
  const processedObjects = objects.map(obj => {
    if (obj.data?.properties?.parent_room_id) {
      const parentObj = objects.find(parent => parent.id === obj.data.properties.parent_room_id);
      if (parentObj) {
        // Adjust position relative to parent
        obj.position = {
          x: parentObj.position.x + 50,
          y: parentObj.position.y + 50
        };
        
        // Adjust size to be smaller than parent
        const parentSize = parentObj.data?.size;
        if (parentSize) {
          obj.data.size = {
            width: Math.max(parentSize.width * 0.7, 100),
            height: Math.max(parentSize.height * 0.7, 80)
          };
        }
        
        // Inherit style properties but make it visually distinct
        if (obj.data?.style) {
          obj.data.style = {
            ...obj.data.style,
            border: '1px dashed #64748b',
            opacity: 0.9
          };
        }
        
        // Increment zIndex to draw above parent
        obj.zIndex = (parentObj.zIndex || 0) + 1;
      }
    }
    return obj;
  });

  return {
    layers: layers || [],
    objects: processedObjects,
    edges,
    isLoading: isLoadingLayers || isLoadingObjects,
    error // Include error in the return value
  };
}
