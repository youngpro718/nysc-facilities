
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { transformSpaceToNode } from "../utils/nodeTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, RawFloorPlanObject, Position, Size } from "../types/floorPlanTypes";

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
    safeSpaceData.objects.map((rawObj: any, index) => {
      // Ensure we have a position (use default grid position if none exists)
      const defaultPosition: Position = {
        x: (index % 4) * 250 + 100, // Create a grid layout with 4 columns
        y: Math.floor(index / 4) * 250 + 100
      };
      
      // Ensure we have a size
      const defaultSize: Size = { width: 150, height: 100 };
      
      // Parse position if it's a string
      let parsedPosition = defaultPosition;
      if (rawObj.position) {
        if (typeof rawObj.position === 'string') {
          try {
            parsedPosition = JSON.parse(rawObj.position);
            // Validate the parsed position
            if (!parsedPosition.x || !parsedPosition.y || 
                typeof parsedPosition.x !== 'number' || 
                typeof parsedPosition.y !== 'number') {
              parsedPosition = defaultPosition;
            }
          } catch {
            parsedPosition = defaultPosition;
          }
        } else if (typeof rawObj.position === 'object' && 
                  rawObj.position !== null &&
                  typeof rawObj.position.x === 'number' &&
                  typeof rawObj.position.y === 'number') {
          parsedPosition = rawObj.position;
        }
      }
      
      // Parse size if it's a string
      let parsedSize = defaultSize;
      if (rawObj.size) {
        if (typeof rawObj.size === 'string') {
          try {
            parsedSize = JSON.parse(rawObj.size);
            // Validate the parsed size
            if (!parsedSize.width || !parsedSize.height || 
                typeof parsedSize.width !== 'number' || 
                typeof parsedSize.height !== 'number') {
              parsedSize = defaultSize;
            }
          } catch {
            parsedSize = defaultSize;
          }
        } else if (typeof rawObj.size === 'object' && 
                  rawObj.size !== null &&
                  typeof rawObj.size.width === 'number' &&
                  typeof rawObj.size.height === 'number') {
          parsedSize = rawObj.size;
        }
      }
      
      // Create a standardized object with all required fields
      return {
        ...rawObj,
        id: rawObj.id || `obj-${index}`,
        position: parsedPosition,
        size: parsedSize,
        properties: rawObj.properties || {},
        object_type: rawObj.object_type || rawObj.type || 'room'
      } as RawFloorPlanObject;
    }) : 
    [];
  
  // Transform all objects into floor plan nodes
  const objects = objectsWithPositions.map((obj, index) => {
    // Ensure each object has the required properties
    try {
      return transformSpaceToNode(obj, index);
    } catch (error) {
      console.error('Error transforming object to node:', error, obj);
      // Return a fallback node in case of errors
      return {
        id: obj.id || `error-${index}`,
        type: obj.object_type || 'room',
        position: obj.position as Position || { x: index * 100, y: index * 100 },
        data: {
          label: obj.name || 'Error Object',
          type: obj.object_type || 'room',
          size: obj.size as Size || { width: 150, height: 100 },
          style: {
            backgroundColor: '#f87171',
            border: '1px dashed #ef4444',
            opacity: 0.7
          },
          properties: obj.properties || {},
          rotation: obj.rotation || 0
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
