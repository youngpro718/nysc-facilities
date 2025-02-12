import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Route, Link, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Position, Size } from '../types/floorPlanTypes';

interface HallwayToolsProps {
  floorId: string;
  selectedHallwayId?: string;
  onHallwayCreate?: () => void;
  onHallwayRoute?: (hallwayId: string) => void;
  onHallwayConnect?: (hallwayId: string) => void;
  onHallwayDelete?: (hallwayId: string) => void;
}

export function HallwayTools({ 
  floorId, 
  selectedHallwayId,
  onHallwayCreate, 
  onHallwayRoute,
  onHallwayConnect,
  onHallwayDelete 
}: HallwayToolsProps) {
  const handleCreateHallway = async () => {
    try {
      const defaultPosition: Position = { x: 100, y: 100 };
      const defaultSize: Size = { width: 300, height: 50 };

      const { data, error } = await supabase
        .from('hallways')
        .insert({
          floor_id: floorId,
          name: 'New Hallway',
          position: defaultPosition,
          size: defaultSize,
          status: 'active',
          type: 'standard',
          accessibility: 'fully_accessible'
        })
        .select()
        .single();

      if (error) throw error;
      onHallwayCreate?.();
    } catch (error) {
      console.error('Error creating hallway:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={handleCreateHallway} title="Add Hallway">
        <Plus className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => selectedHallwayId && onHallwayRoute?.(selectedHallwayId)}
        disabled={!selectedHallwayId}
        title="Route Hallway"
      >
        <Route className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => selectedHallwayId && onHallwayConnect?.(selectedHallwayId)}
        disabled={!selectedHallwayId}
        title="Connect Hallway"
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => selectedHallwayId && onHallwayDelete?.(selectedHallwayId)}
        disabled={!selectedHallwayId}
        title="Delete Hallway"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
