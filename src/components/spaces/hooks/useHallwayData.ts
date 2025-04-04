import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHallwayData = () => {
  const [hallways, setHallways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHallways = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('spaces')
          .select(`
            id, 
            name,
            type,
            status,
            room_number,
            floor_id,
            position,
            properties,
            hallway_properties (
              id,
              hallway_id,
              section,
              traffic_flow,
              accessibility,
              emergency_route
            ),
            floors (
              id,
              name,
              floor_number,
              building_id,
              buildings (
                id,
                name
              )
            )
          `)
          .eq('type', 'hallway');

        if (error) {
          console.error('Error fetching hallways:', error.message || 'Unknown error');
          setError(error.message || 'Failed to fetch hallways');
          return;
        }

        setHallways(data || []);
      } catch (err) {
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unknown error fetching hallways';

        console.error('Exception in fetchHallways:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHallways();
  }, []);

  const getHallwaysForFloor = async (floorId: string) => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          id, 
          name,
          type,
          status,
          room_number,
          floor_id,
          position,
          properties,
          hallway_properties (
            id,
            hallway_id,
            section,
            traffic_flow,
            accessibility,
            emergency_route
          ),
          floors (
            id,
            name,
            floor_number,
            building_id,
            buildings (
              id,
              name
            )
          )
        `)
        .eq('type', 'hallway')
        .eq('floor_id', floorId);

      if (error) {
        console.error('Error fetching hallways:', error.message || 'Unknown error');
        return [];
      }

      return data || [];
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Unknown error fetching hallways';

      console.error('Exception in getHallwaysForFloor:', errorMessage);
      return [];
    }
  };

  return {
    hallways,
    loading,
    error,
    getHallwaysForFloor
  };
};
