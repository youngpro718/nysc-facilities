
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightingFixtureFormData, LightingZoneFormData } from "../schemas/lightingSchema";

export const useLightingSubmit = (onFixtureCreated: () => void, onZoneCreated: () => void) => {
  const [open, setOpen] = useState(false);

  const onSubmitFixture = async (data: LightingFixtureFormData) => {
    try {
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
          emergency_circuit: data.emergency_circuit,
          maintenance_notes: data.maintenance_notes,
          ballast_check_notes: data.ballast_check_notes,
          zone_id: data.zone_id || null
        })
        .select()
        .single();

      if (fixtureError) throw fixtureError;

      // Then create the spatial assignment
      const { error: assignmentError } = await supabase
        .from('spatial_assignments')
        .insert({
          fixture_id: fixture.id,
          space_id: data.space_id,
          space_type: data.space_type,
          position: data.position
        });

      if (assignmentError) throw assignmentError;

      toast.success("Lighting fixture saved successfully");
      onFixtureCreated();
      setOpen(false);
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to save lighting fixture");
      return false;
    }
  };

  const onSubmitZone = async (data: LightingZoneFormData) => {
    try {
      const { error } = await supabase
        .from('lighting_zones')
        .insert({
          name: data.name,
          type: data.type,
          floor_id: data.floorId,
        });

      if (error) throw error;

      toast.success("Lighting zone created successfully");
      onZoneCreated();
      setOpen(false);
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to create lighting zone");
      return false;
    }
  };

  return { open, setOpen, onSubmitFixture, onSubmitZone };
};
