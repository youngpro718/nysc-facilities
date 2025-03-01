
import { useCallback, useRef } from 'react';
import { NodeChange, OnNodesChange, Node, useReactFlow } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

interface NodeUpdateData {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  label?: string;
  properties?: Record<string, any>;
}

export function useFloorPlanNodes(onNodesChange: OnNodesChange) {
  const pendingUpdates = useRef(new Set<string>());
  const { getNode } = useReactFlow();
  
  const debouncedUpdateNode = useCallback(
    debounce(async (nodeId: string, node: Node) => {
      try {
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

        // Only include size if it's valid
        if (node.data?.size &&
            typeof node.data.size.width === 'number' &&
            typeof node.data.size.height === 'number' &&
            !isNaN(node.data.size.width) &&
            !isNaN(node.data.size.height)) {
          updateData.size = node.data.size;
        }

        // Only include rotation if it's valid
        if (typeof node.rotation === 'number' && !isNaN(node.rotation)) {
          updateData.rotation = node.rotation;
        } else if (typeof node.data?.rotation === 'number' && !isNaN(node.data.rotation)) {
          updateData.rotation = node.data.rotation;
        }
        
        // Include label if available
        if (node.data?.label) {
          updateData.label = node.data.label;
        }
        
        // Include properties if available
        if (node.data?.properties) {
          updateData.properties = node.data.properties;
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
