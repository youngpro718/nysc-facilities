
import { useCallback, useRef } from 'react';
import { NodeChange, OnNodesChange, Node, useReactFlow } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

interface NodeUpdateData {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  name?: string;
  properties?: Record<string, any>;
}

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

        const table = node.type === 'door' ? 'doors' : 
                     node.type === 'hallway' ? 'hallways' : 
                     node.type === 'room' ? 'rooms' : null;
                     
        if (!table) {
          throw new Error(`Invalid node type: ${node.type}`);
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
        
        // Include name/label if available (not label - that was causing the 400 error)
        if (node.data && node.data.label) {
          updateData.name = node.data.label;
        }
        
        // For properties, we need to extract what's allowed in each table
        // This varies based on table type - for now just pass along what's in properties
        if (node.data && node.data.properties) {
          // Only include valid properties for the specific table
          // For hallways table, the schema expects specific column names
          if (table === 'hallways') {
            // Filter properties to only include valid hallway columns
            // Don't try to update properties directly
            if (node.data.properties.room_number) {
              // No room_number field for hallways
            }
            if (node.data.properties.space_type) {
              updateData.type = node.data.properties.space_type;
            }
            if (node.data.properties.status) {
              updateData.status = node.data.properties.status;
            }
            // Don't pass other properties that don't match columns
          } else {
            // For rooms and doors, include properties object
            updateData.properties = node.data.properties;
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
