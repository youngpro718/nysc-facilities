import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Position, Size } from '../types/floorPlanTypes';

interface RoomToolsProps {
  floorId: string;
  selectedRoomId?: string;
  onRoomCreate?: () => void;
  onRoomEdit?: (roomId: string) => void;
  onRoomDelete?: (roomId: string) => void;
  onRoomConnect?: (roomId: string) => void;
}

export function RoomTools({ 
  floorId, 
  selectedRoomId,
  onRoomCreate, 
  onRoomEdit, 
  onRoomDelete, 
  onRoomConnect 
}: RoomToolsProps) {
  const handleCreateRoom = async () => {
    try {
      const defaultPosition: Position = { x: 100, y: 100 };
      const defaultSize: Size = { width: 150, height: 100 };

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          floor_id: floorId,
          name: 'New Room',
          position: defaultPosition,
          size: defaultSize,
          status: 'active',
          current_function: 'default',
          room_number: 'TBD'
        })
        .select()
        .single();

      if (error) throw error;
      onRoomCreate?.();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={handleCreateRoom} title="Add Room">
        <Plus className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => selectedRoomId && onRoomEdit?.(selectedRoomId)} 
        disabled={!selectedRoomId}
        title="Edit Room"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => selectedRoomId && onRoomDelete?.(selectedRoomId)}
        disabled={!selectedRoomId}
        title="Delete Room"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => selectedRoomId && onRoomConnect?.(selectedRoomId)}
        disabled={!selectedRoomId}
        title="Connect Rooms"
      >
        <Link className="h-4 w-4" />
      </Button>
    </div>
  );
}
