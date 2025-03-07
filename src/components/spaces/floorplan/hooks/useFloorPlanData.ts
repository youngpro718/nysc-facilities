
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { transformSpaceToNode } from "../utils/nodeTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, RawFloorPlanObject, Position, Size } from "../types/floorPlanTypes";
import { supabase } from "@/integrations/supabase/client";

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

  // Query for lighting fixtures data
  const { data: lightingData, isLoading: isLoadingLighting } = useQuery({
    queryKey: ['floorplan-lighting', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, space_id, space_type, status, position, name')
        .eq('floor_id', floorId)
        .order('space_id');
        
      if (error) throw error;
      
      // Group fixtures by space_id for easier access
      const fixturesBySpace: Record<string, any[]> = {};
      data?.forEach(fixture => {
        if (!fixturesBySpace[fixture.space_id]) {
          fixturesBySpace[fixture.space_id] = [];
        }
        fixturesBySpace[fixture.space_id].push(fixture);
      });
      
      return fixturesBySpace;
    },
    enabled: !!floorId
  });

  // Ensure spaceData is properly structured to avoid "undefined" errors
  const safeSpaceData = spaceData || { objects: [], connections: [] };
  
  // Assign default positions to objects without positions
  // This is crucial for the 3D view to show objects
  const objectsWithPositions = Array.isArray(safeSpaceData.objects) ? 
    safeSpaceData.objects.map((rawObj: any, index) => {
      // Default values
      const defaultPosition: Position = {
        x: (index % 4) * 250 + 100, // Create a grid layout with 4 columns
        y: Math.floor(index / 4) * 250 + 100
      };
      const defaultSize: Size = { width: 150, height: 100 };
      
      // Parse position if it's a string or ensure it's a valid object
      let parsedPosition = defaultPosition;
      if (rawObj.position) {
        if (typeof rawObj.position === 'string') {
          try {
            parsedPosition = JSON.parse(rawObj.position);
            // Validate the parsed position
            if (!parsedPosition || 
                typeof parsedPosition !== 'object' ||
                typeof parsedPosition.x !== 'number' || 
                typeof parsedPosition.y !== 'number' ||
                isNaN(parsedPosition.x) || 
                isNaN(parsedPosition.y)) {
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
      
      // Parse size if it's a string or ensure it's a valid object
      let parsedSize = defaultSize;
      if (rawObj.size) {
        if (typeof rawObj.size === 'string') {
          try {
            parsedSize = JSON.parse(rawObj.size);
            // Validate the parsed size
            if (!parsedSize || 
                typeof parsedSize !== 'object' ||
                typeof parsedSize.width !== 'number' || 
                typeof parsedSize.height !== 'number' ||
                isNaN(parsedSize.width) || 
                isNaN(parsedSize.height)) {
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
      
      // Determine the object type
      const objectType = rawObj.object_type || rawObj.type || 'room';
      
      // Add lighting data if available
      let enhancedProperties = rawObj.properties || {};
      if (lightingData && rawObj.id && lightingData[rawObj.id]) {
        const fixtures = lightingData[rawObj.id];
        const functionalLights = fixtures.filter((f: any) => f.status === 'functional').length;
        const totalLights = fixtures.length;
        
        enhancedProperties = {
          ...enhancedProperties,
          lighting_fixtures: fixtures,
          functional_lights: functionalLights,
          total_lights: totalLights,
          lighting_status: 
            totalLights === 0 ? 'unknown' :
            functionalLights === totalLights ? 'all_functional' :
            functionalLights === 0 ? 'all_non_functional' : 
            'partial_issues'
        };
      }
      
      // Create a standardized object with all required fields
      return {
        ...rawObj,
        id: rawObj.id || `obj-${index}`,
        position: parsedPosition,
        size: parsedSize,
        properties: enhancedProperties,
        object_type: objectType,
        rotation: rawObj.rotation || 0
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
    isLoading: isLoadingLayers || isLoadingObjects || isLoadingLighting,
    error // Include error in the return value
  };
}
