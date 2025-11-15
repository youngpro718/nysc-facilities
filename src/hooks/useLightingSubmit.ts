
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LightingFixtureFormData, LightingZoneFormData } from '@/types/lighting';
import { createLightingFixture, createLightingZone } from '@/lib/supabase';

export const useLightingSubmit = (onFixtureCreated: () => void, onZoneCreated: () => void) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const onSubmitFixture = async (data: LightingFixtureFormData) => {
    try {
      console.log("Creating new lighting fixture:", data);
      
      await createLightingFixture(data);

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
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
      
      await createLightingZone(data);

      // Invalidate zones query
      queryClient.invalidateQueries({ queryKey: ['lighting-zones'] });

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
