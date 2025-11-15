import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { transformSpaceToNode } from "../utils/nodeTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, RawFloorPlanObject, Position, Size } from "../types/floorPlanTypes";
import { supabase } from "@/lib/supabase";

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
      if (!floorId) return {};
      
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, space_id, status, position, name, type, floor_id')
        .eq('floor_id', floorId)
        .order('space_id');
        
      if (error) throw error;
      
      // Group fixtures by space_id for easier access
      const fixturesBySpace: Record<string, any[]> = {};
      
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
      
      // Use null check before trying to access lighting data
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
    
  // Create edges from connections data - using a safe approach
  const edges = Array.isArray(safeSpaceData.connections) ? 
    createEdgesFromConnections(safeSpaceData.connections) : 
    [];
  
  const FP_DEBUG = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FLOORPLAN_DEBUG === 'true';
  if (FP_DEBUG) {
    console.log('Transformed objects:', objects);
    console.log('Created edges:', edges);
  }
  
  // Detailed object analysis for 3D rendering
  if (FP_DEBUG && objects.length > 0) {
    console.log('=== DETAILED OBJECT ANALYSIS ===');
    objects.forEach((obj, index) => {
      console.log(`Object ${index + 1}:`, {
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
    console.log('=== END OBJECT ANALYSIS ===');
  }

  // Process parent/child relationships and establish connections
  const processedObjects = objects.map(obj => {
    // Handle parent/child room relationships
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

    // Process connected spaces for each object
    if (obj.type === 'hallway' || obj.type === 'room') {
      // Find all objects connected to this one
      const connectedTo = edges
        .filter(edge => edge.source === obj.id || edge.target === obj.id)
        .map(edge => {
          const connectionId = edge.id;
          const connectedObjectId = edge.source === obj.id ? edge.target : edge.source;
          const connectedObject = objects.find(o => o.id === connectedObjectId);
          
          return {
            id: connectedObjectId,
            connectionId,
            type: connectedObject?.type || 'unknown',
            name: connectedObject?.data?.label || 'Unknown'
          };
        });
      
      // Add connected spaces to the object properties
      if (connectedTo.length > 0) {
        obj.data.properties = {
          ...obj.data.properties,
          connected_spaces: connectedTo
        };
      }
    }

    // For hallways, ensure they're properly sized based on connections
    if (obj.type === 'hallway' && edges.length > 0) {
      // Find connections to this hallway
      const hallwayConnections = edges.filter(edge => 
        edge.source === obj.id || edge.target === obj.id
      );
      
      if (hallwayConnections.length >= 2) {
        // Get connected room positions to determine hallway length and orientation
        const connectedRooms = hallwayConnections.map(conn => {
          const roomId = conn.source === obj.id ? conn.target : conn.source;
          return objects.find(room => room.id === roomId);
        }).filter(Boolean);
        
        if (connectedRooms.length >= 2) {
          // Determine if hallway should be horizontal or vertical based on connected rooms
          let minX = Math.min(...connectedRooms.map(room => room.position.x));
          let maxX = Math.max(...connectedRooms.map(room => room.position.x));
          let minY = Math.min(...connectedRooms.map(room => room.position.y));
          let maxY = Math.max(...connectedRooms.map(room => room.position.y));
          
          const xDistance = maxX - minX;
          const yDistance = maxY - minY;
          
          // Determine if hallway should be horizontal or vertical
          const isHorizontal = xDistance > yDistance;
          
          // Size and position the hallway accordingly
          if (isHorizontal) {
            // Horizontal hallway - long width, short height
            obj.data.size = {
              width: Math.max(xDistance + 200, 300),  // Add padding to extend beyond rooms
              height: 50                             // Standard hallway width
            };
            
            // Position hallway between connected rooms
            obj.position = {
              x: (minX + maxX) / 2,
              y: obj.position.y  // Keep original Y position
            };
            
            // Set rotation to 0 for horizontal hallway
            obj.data.rotation = 0;
          } else {
            // Vertical hallway - short width, long height
            obj.data.size = {
              width: 50,                             // Standard hallway width
              height: Math.max(yDistance + 200, 300)  // Add padding to extend beyond rooms
            };
            
            // Position hallway between connected rooms
            obj.position = {
              x: obj.position.x,  // Keep original X position
              y: (minY + maxY) / 2
            };
            
            // Set rotation to 90 degrees for vertical hallway
            obj.data.rotation = 90;
          }
        }
      }
    }
    
    return obj;
  });

  // Don't block loading on lighting data since it's optional
  const finalIsLoading = isLoadingLayers || isLoadingObjects;
  
  if (FP_DEBUG) {
    console.log('useFloorPlanData - Loading states:', {
      isLoadingLayers,
      isLoadingObjects, 
      isLoadingLighting,
      finalIsLoading,
      objectsCount: processedObjects.length
    });
  }

  return {
    layers: layers || [],
    objects: processedObjects,
    edges,
    isLoading: finalIsLoading,
    error // Include error in the return value
  };
}
