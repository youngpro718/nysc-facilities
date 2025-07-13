
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizardContext } from '../hooks/useWizardContext';
import { WizardStepProps } from '../types/index';
import { ISSUE_TYPES } from '../constants/issueTypes';

export function ReviewStep({ form, isLoading }: WizardStepProps) {
  const { selectedPhotos } = useWizardContext();
  
  const buildingId = form.watch('building_id');
  const floorId = form.watch('floor_id');
  const roomId = form.watch('room_id');
  
  const { data: building } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      if (!buildingId) return null;
      const { data } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single();
      return data;
    },
    enabled: !!buildingId
  });
  
  const { data: floor } = useQuery({
    queryKey: ['floor', floorId],
    queryFn: async () => {
      if (!floorId) return null;
      const { data } = await supabase
        .from('floors')
        .select('*')
        .eq('id', floorId)
        .single();
      return data;
    },
    enabled: !!floorId
  });
  
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      return data;
    },
    enabled: !!roomId
  });

  const issueType = ISSUE_TYPES.find(type => type.id === form.watch('issue_type'));

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Review and Submit</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Location</h4>
          <p className="text-muted-foreground">
            {building?.name}{floor ? `, Floor ${floor.floor_number}` : ''}{room ? `, Room ${room.room_number} - ${room.name}` : ''}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Issue Type</h4>
          <div className="flex items-center gap-2">
            {issueType && (
              <>
                <span className={issueType.color}>{issueType.icon}</span>
                <span>{issueType.label}</span>
              </>
            )}
            {form.watch('problem_type') && (
              <Badge variant="secondary">
                {form.watch('problem_type')}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Description</h4>
          <p className="text-muted-foreground">{form.watch('description') || 'No description provided'}</p>
        </div>

        {selectedPhotos.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Photos</h4>
            <div className="grid grid-cols-4 gap-2">
              {selectedPhotos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Issue photo ${index + 1}`}
                  className="rounded-lg aspect-square object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Submitting your issue...
          </div>
        )}
      </div>
    </Card>
  );
}
