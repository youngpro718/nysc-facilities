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
  position?: Record<string, number>;
  size?: Record<string, number>;
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
    }, 1000),
    []
  );

  // Cleanup function
  useEffect(() => {
    return () => {
      saveNodeUpdates.cancel();
    };
  }, [saveNodeUpdates]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach((change) => {
        if (change.type === 'position' && 'position' in change && 'id' in change) {
          const update = pendingUpdates.current.get(change.id) || {};
          update.position = {
            x: change.position.x,
            y: change.position.y
          };
          pendingUpdates.current.set(change.id, update);
        }
        else if (change.type === 'dimensions' && 'dimensions' in change && 'id' in change) {
          const update = pendingUpdates.current.get(change.id) || {};
          if (change.dimensions) {
            update.size = {
              width: change.dimensions.width,
              height: change.dimensions.height
            };
          }
          pendingUpdates.current.set(change.id, update);
        }
      });

      // Trigger save
      saveNodeUpdates();
    },
    [onNodesChange, saveNodeUpdates]
  );

  return {
    handleNodesChange,
  };
}
