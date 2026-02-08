import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { processFloorPlanObjects } from "../utils/floorPlanTransformers";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, RawFloorPlanObject, Position, Size } from "../types/floorPlanTypes";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

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
      logger.debug('Fetching floor plan objects for floor:', floorId);
      return fetchFloorPlanObjects(floorId);
    },
    enabled: !!floorId
  });

  // Query for lighting fixtures data
  const { data: lightingData, isLoading: isLoadingLighting } = useQuery({
    queryKey: ['floorplan-lighting', floorId],
    queryFn: async () => {
      if (!floorId) return {};
      
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, space_id, status, position, name, type, floor_id')
        .eq('floor_id', floorId)
        .order('space_id');
        
      if (error) throw error;
      
      // Group fixtures by space_id for easier access
      const fixturesBySpace: Record<string, unknown[]> = {};
      
      if (data && Array.isArray(data)) {
        data.forEach(fixture => {
          if (!fixture || !fixture.space_id) return;
          
          if (!fixturesBySpace[fixture.space_id]) {
            fixturesBySpace[fixture.space_id] = [];
          }
          fixturesBySpace[fixture.space_id].push(fixture);
        });
      }
      
      return fixturesBySpace;
    },
    enabled: !!floorId
  });

  // Ensure spaceData is properly structured to avoid "undefined" errors
  const safeSpaceData = spaceData || { objects: [], connections: [] };
  
  // Assign default positions to objects without positions
  const objectsWithPositions = Array.isArray(safeSpaceData.objects) ? 
    safeSpaceData.objects.map((rawObj: Record<string, unknown>, index) => {
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
      
      // Use null check before trying to access lighting data
      if (lightingData && rawObj.id && lightingData[rawObj.id]) {
        const fixtures = lightingData[rawObj.id];
        const functionalLights = fixtures.filter((f: Record<string, unknown>) => f.status === 'functional').length;
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
  
  // Create edges from connections data
  const edges = Array.isArray(safeSpaceData.connections) ? 
    createEdgesFromConnections(safeSpaceData.connections) : 
    [];

  // Transform all objects into floor plan nodes using the utility
  const objects = processFloorPlanObjects(objectsWithPositions, edges);
    
  const FP_DEBUG = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FLOORPLAN_DEBUG === 'true';
  if (FP_DEBUG) {
    logger.debug('Transformed objects:', objects);
    logger.debug('Created edges:', edges);
    
    if (objects.length > 0) {
      logger.debug('=== DETAILED OBJECT ANALYSIS ===');
      objects.forEach((obj, index) => {
        logger.debug(`Object ${index + 1}:`, {
          id: obj.id,
          type: obj.type,
          position: obj.position,
          data: obj.data,
          hasSize: !!obj.data?.size,
          size: obj.data?.size,
          hasProperties: !!obj.data?.properties,
          properties: obj.data?.properties
        });
      });
      logger.debug('=== END OBJECT ANALYSIS ===');
    }
  }

  // Don't block loading on lighting data since it's optional
  const finalIsLoading = isLoadingLayers || isLoadingObjects;
  
  return {
    layers: layers || [],
    objects,
    edges,
    isLoading: finalIsLoading,
    error
  };
}
