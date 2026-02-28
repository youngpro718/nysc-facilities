
import { useCallback, useRef } from 'react';
import { NodeChange, OnNodesChange, useReactFlow } from 'reactflow';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import { logger } from '@/lib/logger';

type NodeUpdateData = {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  data?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  type?: string;
  status?: 'active' | 'inactive' | 'under_maintenance';
};

export function useFloorPlanNodes(onNodesChange: OnNodesChange) {
  const pendingUpdates = useRef(new Set<string>());
  const { getNode } = useReactFlow();

  // Debounced update function that sends changes to database
  const updateNodeInDatabase = useCallback(debounce(async (nodeId: string) => {
    try {
      if (pendingUpdates.current.has(nodeId)) {
        const node = getNode(nodeId);
        if (!node) {
          return;
        }

        logger.debug(`Preparing to update node in database:`, node);

        // Determine the correct table based on node type
        let table: 'rooms' | 'doors' | 'hallways';
        if (node.type === 'room') {
          table = 'rooms';
        } else if (node.type === 'door') {
          table = 'doors';
        } else if (node.type === 'hallway') {
          table = 'hallways';
        } else {
          throw new Error(`Invalid node type: ${node.type}`);
        }

        // Create update payload based on node data
        const updateData: NodeUpdateData = {};

        // Extract position, size and rotation from node
        if (node.position) {
          updateData.position = node.position;
        }

        if (node.data?.size) {
          updateData.size = node.data.size;
        }

        if (node.data?.rotation !== undefined) {
          updateData.rotation = node.data.rotation;
        }

        // For hallways, update the properties
        if (node.type === 'hallway' && node.data?.properties) {
          updateData.properties = node.data.properties;
        }

        logger.debug(`Updating ${node.type} in ${table}: ${nodeId}`, updateData);

        // Update in the database
        const { error } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', nodeId);

        if (error) {
          logger.error(`Error updating ${node.type}:`, error);
          toast.error(`Failed to update ${node.type}: ${error.message}`);
        } else {
          logger.debug(`Successfully updated ${node.type} in ${table}`);
          
          // If the node was a hallway, also update hallway_properties table if needed
          if (node.type === 'hallway' && node.data?.properties) {
            const { section, traffic_flow, accessibility, emergency_route, maintenance_priority, capacity_limit } = node.data.properties;
            
            if (section || traffic_flow || accessibility || emergency_route || maintenance_priority || capacity_limit) {
              logger.debug('Updating hallway properties:', {
                section, traffic_flow, accessibility, emergency_route, maintenance_priority, capacity_limit
              });
              
              const hallwayProps = {
                section,
                traffic_flow,
                accessibility,
                emergency_route,
                maintenance_priority,
                capacity_limit
              };
              
              // First check if a record exists
              const { data: existingProps, error: checkError } = await supabase
                .from('hallway_properties')
                .select('*')
                .eq('space_id', nodeId)
                .single();
                
              if (checkError && checkError.code !== 'PGRST116') { // Not found error
                logger.error('Error checking hallway properties:', checkError);
              }
              
              // If record exists, update it, otherwise insert new
              if (existingProps) {
                const { error: propsError } = await supabase
                  .from('hallway_properties')
                  .update(hallwayProps)
                  .eq('space_id', nodeId);
                  
                if (propsError) {
                  logger.error('Error updating hallway properties:', propsError);
                } else {
                  logger.debug('Successfully updated hallway properties');
                }
              } else {
                const { error: insertError } = await supabase
                  .from('hallway_properties')
                  .insert([{ space_id: nodeId, ...hallwayProps }]);
                  
                if (insertError) {
                  logger.error('Error inserting hallway properties:', insertError);
                } else {
                  logger.debug('Successfully inserted hallway properties');
                }
              }
            }
          }
        }

        // Remove from pending updates
        pendingUpdates.current.delete(nodeId);
      }
    } catch (err) {
      logger.error('Error in updateNodeInDatabase:', err);
      pendingUpdates.current.delete(nodeId);
    }
  }, 500), [getNode]);

  // Handle node changes (position, size, etc.)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // First apply changes using the original handler
    onNodesChange(changes);

    // Track changes that need to be synced with database
    changes.forEach((change) => {
      if ((change.type === 'position' && change.position) || 
          (change.type === 'dimensions' && change.dimensions) ||
          (change.type === 'select') // Selection might include rotation changes
      ) {
        pendingUpdates.current.add(change.id);
        updateNodeInDatabase(change.id);
      }
    });
  }, [onNodesChange, updateNodeInDatabase]);

  return handleNodesChange;
}
