
import { useCallback } from 'react';
import { OnNodesChange } from 'reactflow';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFloorPlanNodes(onNodesChange: any) {
  const handleNodesChange: OnNodesChange = useCallback(
    async (changes) => {
      onNodesChange(changes);
      
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.id) {
          try {
            console.log('Saving position for node:', change.id, change.position);
            
            const positionData = {
              x: Number(change.position.x),
              y: Number(change.position.y)
            };

            console.log('Saving positionData:', positionData);

            const { error } = await supabase
              .from('floor_plan_objects')
              .update({ position: positionData })
              .eq('id', change.id);

            if (error) {
              console.error('Error saving position:', error);
              toast.error('Failed to save position');
            } else {
              toast.success('Position updated');
            }
          } catch (err) {
            console.error('Error in position update:', err);
            toast.error('Failed to save position');
          }
        }
      }
    },
    [onNodesChange]
  );

  return { handleNodesChange };
}
