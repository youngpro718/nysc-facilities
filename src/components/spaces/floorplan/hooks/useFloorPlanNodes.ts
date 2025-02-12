import { useCallback, useEffect, useRef } from 'react';
import { Node, NodeChange, NodePositionChange, NodeDimensionChange } from 'reactflow';
import { supabase } from '@/integrations/supabase/client';
import debounce from 'lodash/debounce';

export function useFloorPlanNodes(onNodesChange: (changes: NodeChange[]) => void) {
  const pendingUpdates = useRef(new Map<string, any>());

  // Debounced function to save node updates
  const saveNodeUpdates = useCallback(
    debounce(async () => {
      if (pendingUpdates.current.size === 0) return;

      const updates = Array.from(pendingUpdates.current.entries());
      pendingUpdates.current.clear();

      for (const [nodeId, data] of updates) {
        try {
          const isRoom = !nodeId.startsWith('hallway-');
          const table = isRoom ? 'rooms' : 'hallways';
          const actualId = isRoom ? nodeId : nodeId.replace('hallway-', '');

          const { error } = await supabase
            .from(table)
            .update(data)
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

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && 'position' in change) {
          const nodeId = change.id;
          pendingUpdates.current.set(nodeId, {
            position: change.position
          });
          saveNodeUpdates();
        }
      });

      onNodesChange(changes);
    },
    [onNodesChange, saveNodeUpdates]
  );

  useEffect(() => {
    return () => {
      saveNodeUpdates.cancel();
    };
  }, [saveNodeUpdates]);

  return { handleNodesChange };
}
