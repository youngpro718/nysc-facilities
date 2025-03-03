
import { useCallback, useRef } from 'react';
import { NodeChange, OnNodesChange, Node, useReactFlow } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

type NodeUpdateData = {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  name?: string;
  properties?: Record<string, any>;
  type?: string;
  status?: 'active' | 'inactive' | 'under_maintenance';
};

export function useFloorPlanNodes(onNodesChange: OnNodesChange) {
  const pendingUpdates = useRef(new Set<string>());
  const { getNode } = useReactFlow();
  
  const debouncedUpdateNode = useCallback(
    debounce(async (nodeId: string, node: Node) => {
      try {
        // Skip update if node doesn't have a type
        if (!node.type) {
          console.warn('Node missing type property:', nodeId);
          return;
        }

        // Determine the correct table based on node type
        let table: 'rooms' | 'doors' | 'new_spaces';
        if (node.type === 'room') {
          table = 'rooms';
        } else if (node.type === 'door') {
          table = 'doors';
        } else if (node.type === 'hallway') {
          // For hallways, we use the new_spaces table
          table = 'new_spaces';
        } else {
          throw new Error(`Invalid node type: ${node.type}`);
        }
                     
        if (!table) {
          throw new Error(`Couldn't determine table for type: ${node.type}`);
        }

        // Build update data from node's current state
        const updateData: NodeUpdateData = {};

        // Only include position if it's valid
        if (node.position && 
            typeof node.position.x === 'number' && 
            typeof node.position.y === 'number' &&
            !isNaN(node.position.x) && 
            !isNaN(node.position.y)) {
          updateData.position = node.position;
        }

        // Only include size if node.data exists and size is valid
        if (node.data && node.data.size &&
            typeof node.data.size.width === 'number' &&
            typeof node.data.size.height === 'number' &&
            !isNaN(node.data.size.width) &&
            !isNaN(node.data.size.height)) {
          updateData.size = node.data.size;
        }

        // Only include rotation if it's valid - get from data or node
        const nodeRotation = node.data && node.data.rotation !== undefined ? 
          node.data.rotation : 
          (node as any).rotation;
          
        if (typeof nodeRotation === 'number' && !isNaN(nodeRotation)) {
          updateData.rotation = nodeRotation;
        }
        
        // Include name if available
        if (node.data && node.data.label) {
          updateData.name = node.data.label;
        }
        
        // For hallway-specific fields, use properties
        if (node.type === 'hallway') {
          // For hallways in new_spaces, update the properties field directly
          if (node.data && node.data.properties) {
            updateData.properties = {
              // Keep existing properties and merge with updates
              ...(typeof node.data.properties === 'object' ? node.data.properties : {}),
              // Add any new properties the node might have
            };
            
            // Ensure status is a valid enum value if it exists
            if (node.data.properties.status) {
              const status = node.data.properties.status;
              if (status === 'active' || status === 'inactive' || status === 'under_maintenance') {
                updateData.status = status;
              }
            }
          }
        }
        // For other node types, use standard fields
        else if (node.data && node.data.properties) {
          if (node.data.properties.status) {
            // Ensure status is a valid enum value
            const status = node.data.properties.status;
            if (status === 'active' || status === 'inactive' || status === 'under_maintenance') {
              updateData.status = status;
            }
          }
        }

        // Only proceed if we have valid data to update
        if (Object.keys(updateData).length === 0) {
          console.warn('No valid data to update for node:', nodeId);
          return;
        }

        console.log('Updating node:', { nodeId, type: node.type, table, data: updateData });
        
        const { data, error } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', nodeId)
          .select();

        if (error) throw error;
        
        // Only show success toast for manual changes, not position
        const isPositionOnlyUpdate = 
          Object.keys(updateData).length === 1 && 
          Object.keys(updateData).includes('position');
          
        if (!isPositionOnlyUpdate) {
          toast.success('Changes saved successfully');
        }
      } catch (error) {
        console.error('Error updating node:', error);
        toast.error('Failed to save changes');
      } finally {
        pendingUpdates.current.delete(nodeId);
      }
    }, 1000),
    []
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // First apply changes to the React Flow state
      onNodesChange(changes);

      // Then handle database updates
      changes.forEach((change) => {
        if (!('id' in change)) return;
        const nodeId = change.id;
        
        // Get the actual node from React Flow state
        const node = getNode(nodeId);
        if (!node) {
          console.warn('Node not found:', nodeId);
          return;
        }

        // For any type of change, we'll use the current node state
        // This ensures we always have the correct and complete node data
        if (!pendingUpdates.current.has(nodeId)) {
          pendingUpdates.current.add(nodeId);
          debouncedUpdateNode(nodeId, node);
        }
      });
    },
    [onNodesChange, debouncedUpdateNode, getNode]
  );

  return handleNodesChange;
}
