
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightingFixtureFormData, LightingZoneFormData } from "../schemas/lightingSchema";
import { useQueryClient } from "@tanstack/react-query";

export const useLightingSubmit = (onFixtureCreated: () => void, onZoneCreated: () => void) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const onSubmitFixture = async (data: LightingFixtureFormData) => {
    try {
      console.log("Creating new lighting fixture:", data);
      
      // First create the fixture
      const { data: fixture, error: fixtureError } = await supabase
        .from('lighting_fixtures')
        .insert({
          name: data.name,
          type: data.type,
          technology: data.technology,
          bulb_count: data.bulb_count,
          status: data.status,
          electrical_issues: data.electrical_issues,
          ballast_issue: data.ballast_issue,
          maintenance_notes: data.maintenance_notes,
          ballast_check_notes: data.ballast_check_notes,
          zone_id: data.zone_id || null
        })
        .select()
        .single();

      if (fixtureError) throw fixtureError;

      // Get the next sequence number for this space
      const { data: sequenceData, error: sequenceError } = await supabase
        .rpc('get_next_lighting_sequence', {
          p_space_id: data.space_id
        });

      if (sequenceError) throw sequenceError;

      // Then create the spatial assignment
      const { error: assignmentError } = await supabase
        .from('spatial_assignments')
        .insert({
          fixture_id: fixture.id,
          space_id: data.space_id,
          space_type: data.space_type,
          position: data.position,
          sequence_number: sequenceData
        });

      if (assignmentError) throw assignmentError;

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['lighting_fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });
      queryClient.invalidateQueries({ queryKey: ['room-lighting'] });

      toast.success("Lighting fixture saved successfully");
      onFixtureCreated();
      setOpen(false);
      return true;
    } catch (error: any) {
      console.error('Error saving lighting fixture:', error);
      toast.error(error.message || "Failed to save lighting fixture");
      return false;
    }
  };

  const onSubmitZone = async (data: LightingZoneFormData) => {
    try {
      console.log("Creating new lighting zone:", data);
      
      const { error } = await supabase
        .from('lighting_zones')
        .insert({
          name: data.name,
          type: data.type,
          floor_id: data.floorId,
        });

      if (error) throw error;

      // Invalidate zones query
      queryClient.invalidateQueries({ queryKey: ['lighting_zones'] });

      toast.success("Lighting zone created successfully");
      onZoneCreated();
      setOpen(false);
      return true;
    } catch (error: any) {
      console.error('Error creating lighting zone:', error);
      toast.error(error.message || "Failed to create lighting zone");
      return false;
    }
  };

  return { open, setOpen, onSubmitFixture, onSubmitZone };
};
