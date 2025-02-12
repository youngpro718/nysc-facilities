import { useCallback, useRef } from 'react';
import { OnNodesChange, NodeChange, Node, NodePositionChange, NodeDimensionChange } from 'reactflow';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import debounce from 'lodash/debounce';

interface NodeUpdateData {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  type?: string;
}

export function useFloorPlanNodes(onNodesChange: OnNodesChange) {
  const nodeTypes = useRef<Map<string, string>>(new Map());
  const pendingUpdates = useRef<Map<string, NodeUpdateData>>(new Map());

  const registerNodeTypes = useCallback((nodes: Node[]) => {
    nodes.forEach(node => {
      if (node.id && node.type) {
        nodeTypes.current.set(node.id, node.type);
      }
    });
  }, []);

  const saveNodeUpdates = useCallback(
    debounce(async () => {
      const updates = pendingUpdates.current;
      if (updates.size === 0) return;

      console.log('Processing updates for nodes:', Array.from(updates.entries()));
      pendingUpdates.current = new Map();

      for (const [nodeId, updateData] of updates) {
        try {
          const nodeType = nodeTypes.current.get(nodeId);
          if (!nodeType) {
            console.error(`Unknown node type for node ${nodeId}`);
            continue;
          }

          if (updateData.position) {
            const { x, y } = updateData.position;
            if (isNaN(x) || isNaN(y)) {
              console.error('Invalid position data:', updateData.position);
              continue;
            }
          }

          const updatePayload: Record<string, any> = {};
          
          if (updateData.position) {
            updatePayload.position = updateData.position;
          }
          if (updateData.size) {
            updatePayload.size = updateData.size;
          }
          if (typeof updateData.rotation === 'number') {
            updatePayload.rotation = updateData.rotation;
          }

          if (Object.keys(updatePayload).length === 0) {
            console.log(`No changes to update for node ${nodeId}`);
            continue;
          }

          const isHallway = nodeType === 'hallway';
          const table = isHallway ? 'hallways' : 'rooms';

          console.log(`Updating ${table} node ${nodeId} (type: ${nodeType}):`, updatePayload);

          const { data: updatedNode, error: updateError } = await supabase
            .from(table)
            .update(updatePayload)
            .eq('id', nodeId)
            .select('id, position, size')
            .single();

          if (updateError) {
            console.error(`Error updating ${table}:`, updateError);
            toast.error(`Failed to update ${isHallway ? 'hallway' : 'room'} ${nodeId}`);
            pendingUpdates.current.set(nodeId, updateData);
          } else {
            console.log(`Successfully updated ${table} ${nodeId}:`, updatedNode);
          }
        } catch (err) {
          console.error(`Error updating node ${nodeId}:`, err);
          toast.error(`Failed to save changes for node ${nodeId}`);
          pendingUpdates.current.set(nodeId, updateData);
        }
      }

      if (pendingUpdates.current.size === 0) {
        toast.success('All changes saved successfully');
      } else {
        const failedNodes = Array.from(pendingUpdates.current.entries());
        console.warn('Updates failed for nodes:', failedNodes);
        toast.error(`Failed to save changes for ${failedNodes.length} nodes`);
      }
    }, 500),
    []
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      
      for (const change of changes) {
        if (!('id' in change)) continue;
        
        const nodeId = change.id;
        let updateNeeded = false;
        const currentUpdate = pendingUpdates.current.get(nodeId) || {};

        if (change.type === 'position' && isPositionChange(change)) {
          try {
            const x = Number(change.position.x);
            const y = Number(change.position.y);
            
            if (!isNaN(x) && !isNaN(y)) {
              console.log(`Processing position change for node ${nodeId}:`, { x, y });
              currentUpdate.position = { x, y };
              updateNeeded = true;
            } else {
              console.warn('Invalid position values:', change.position);
            }
          } catch (err) {
            console.warn('Error processing position data:', err);
          }
        }

        if (change.type === 'dimensions' && isDimensionChange(change)) {
          try {
            const width = Number(change.dimensions.width);
            const height = Number(change.dimensions.height);
            
            if (!isNaN(width) && !isNaN(height)) {
              console.log(`Processing dimension change for node ${nodeId}:`, { width, height });
              currentUpdate.size = { width, height };
              updateNeeded = true;
            } else {
              console.warn('Invalid dimension values:', change.dimensions);
            }
          } catch (err) {
            console.warn('Error processing dimension data:', err);
          }
        }

        if (updateNeeded) {
          console.log(`Queueing update for node ${nodeId}:`, currentUpdate);
          pendingUpdates.current.set(nodeId, currentUpdate);
          saveNodeUpdates();
        }
      }
    },
    [onNodesChange, saveNodeUpdates]
  );

  return { handleNodesChange, registerNodeTypes };
}

function isPositionChange(change: NodeChange): change is NodePositionChange {
  return change.type === 'position' && 'position' in change;
}

function isDimensionChange(change: NodeChange): change is NodeDimensionChange {
  return change.type === 'dimensions' && 'dimensions' in change;
}
