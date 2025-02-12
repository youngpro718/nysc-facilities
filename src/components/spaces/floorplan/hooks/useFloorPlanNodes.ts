import { useCallback, useEffect, useRef } from 'react';
import { Node, NodeChange, NodePositionChange, NodeDimensionChange } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import debounce from 'lodash/debounce';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

type NodeUpdate = {
  position?: Position;
  size?: Size;
};

export function useFloorPlanNodes(onNodesChange: (changes: NodeChange[]) => void) {
  const pendingUpdates = useRef(new Map<string, NodeUpdate>());

  // Debounced function to save node updates
  const saveNodeUpdates = useCallback(
    debounce(async () => {
      if (pendingUpdates.current.size === 0) return;

      const updates = Array.from(pendingUpdates.current.entries());
      pendingUpdates.current.clear();

      for (const [nodeId, changes] of updates) {
        try {
          // Determine if this is a room or hallway based on the node ID prefix
          const isRoom = !nodeId.startsWith('hallway-');
          const table = isRoom ? 'rooms' : 'hallways';
          const actualId = isRoom ? nodeId : nodeId.replace('hallway-', '');

          const updateData: Record<string, any> = {};
          
          if (changes.position) {
            updateData.position = changes.position;
          }
          if (changes.size) {
            updateData.size = changes.size;
          }

          const { error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', actualId);

          if (error) {
            console.error(`Error updating ${table}:`, error);
          }
        } catch (error) {
          console.error('Error saving node update:', error);
        }
      }
    }, 500),
    []
  );

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (
          (change.type === 'position' && change.position) ||
          (change.type === 'dimensions' && change.dimensions)
        ) {
          const nodeId = change.id;
          const currentUpdate = pendingUpdates.current.get(nodeId) || {};

          if (change.type === 'position') {
            currentUpdate.position = change.position;
          } else if (change.type === 'dimensions') {
            currentUpdate.size = {
              width: change.dimensions.width,
              height: change.dimensions.height,
            };
          }

          pendingUpdates.current.set(nodeId, currentUpdate);
          saveNodeUpdates();
        }
      });

      // Pass changes to the original handler
      onNodesChange(changes);
    },
    [onNodesChange, saveNodeUpdates]
  );

  // Clean up pending updates on unmount
  useEffect(() => {
    return () => {
      saveNodeUpdates.cancel();
    };
  }, [saveNodeUpdates]);

  return { handleNodesChange };
}
