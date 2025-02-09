
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LightingFixture } from "../types";
import { toast } from "sonner";

export const useLightingFixtures = () => {
  const { data: fixtures, refetch, isLoading } = useQuery({
    queryKey: ['lighting_fixtures'],
    queryFn: async () => {
      console.log("Fetching lighting fixtures...");
      
      const { data, error } = await supabase
        .from('lighting_fixture_details')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching fixtures:', error);
        throw error;
      }
      
      console.log("Raw fixtures data:", data);
      
      return data.map(fixture => ({
        ...fixture,
        electrical_issues: typeof fixture.electrical_issues === 'string' 
          ? JSON.parse(fixture.electrical_issues) 
          : fixture.electrical_issues || {
              short_circuit: false,
              wiring_issues: false,
              voltage_problems: false
            },
        energy_usage_data: {
          daily_usage: [],
          efficiency_rating: null,
          last_reading: null,
          ...(fixture.energy_usage_data ? 
            typeof fixture.energy_usage_data === 'string' ? 
              JSON.parse(fixture.energy_usage_data) : 
              fixture.energy_usage_data
            : {})
        },
        emergency_protocols: {
          emergency_contact: null,
          backup_system: false,
          evacuation_route: false,
          ...(fixture.emergency_protocols ? 
            typeof fixture.emergency_protocols === 'string' ? 
              JSON.parse(fixture.emergency_protocols) : 
              fixture.emergency_protocols
            : {})
        },
        warranty_info: {
          start_date: null,
          end_date: null,
          provider: null,
          terms: null,
          ...(fixture.warranty_info ? 
            typeof fixture.warranty_info === 'string' ? 
              JSON.parse(fixture.warranty_info) : 
              fixture.warranty_info
            : {})
        },
        manufacturer_details: {
          name: null,
          model: null,
          serial_number: null,
          support_contact: null,
          ...(fixture.manufacturer_details ? 
            typeof fixture.manufacturer_details === 'string' ? 
              JSON.parse(fixture.manufacturer_details) : 
              fixture.manufacturer_details
            : {})
        },
        inspection_history: fixture.inspection_history 
          ? (Array.isArray(fixture.inspection_history) 
              ? fixture.inspection_history 
              : typeof fixture.inspection_history === 'string' 
                ? JSON.parse(fixture.inspection_history) 
                : []
            ).map((entry: any) => ({
              date: entry.date || '',
              status: entry.status || '',
              notes: entry.notes
            }))
          : [],
        maintenance_history: fixture.maintenance_history 
          ? (Array.isArray(fixture.maintenance_history)
              ? fixture.maintenance_history
              : typeof fixture.maintenance_history === 'string'
                ? JSON.parse(fixture.maintenance_history)
                : []
            ).map((entry: any) => ({
              date: entry.date || '',
              type: entry.type || '',
              notes: entry.notes
            }))
          : [],
        connected_fixtures: fixture.connected_fixtures || []
      })) as LightingFixture[];
    }
  });

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting fixture:", id);
      const { error } = await supabase
        .from('lighting_fixtures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Lighting fixture deleted successfully");
      refetch();
    } catch (error: any) {
      console.error('Error deleting fixture:', error);
      toast.error(error.message || "Failed to delete lighting fixture");
    }
  };

  const handleBulkDelete = async (selectedFixtures: string[]) => {
    try {
      console.log("Bulk deleting fixtures:", selectedFixtures);
      const { error } = await supabase
        .from('lighting_fixtures')
        .delete()
        .in('id', selectedFixtures);

      if (error) throw error;

      toast.success(`${selectedFixtures.length} fixtures deleted successfully`);
      return true;
    } catch (error: any) {
      console.error('Error bulk deleting fixtures:', error);
      toast.error(error.message || "Failed to delete fixtures");
      return false;
    }
  };

  const handleBulkStatusUpdate = async (selectedFixtures: string[], status: LightingFixture['status']) => {
    try {
      console.log("Updating status for fixtures:", selectedFixtures, "to:", status);
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({ status })
        .in('id', selectedFixtures);

      if (error) throw error;

      toast.success(`Status updated for ${selectedFixtures.length} fixtures`);
      return true;
    } catch (error: any) {
      console.error('Error updating fixtures:', error);
      toast.error(error.message || "Failed to update fixtures");
      return false;
    }
  };

  return {
    fixtures,
    refetch,
    isLoading,
    handleDelete,
    handleBulkDelete,
    handleBulkStatusUpdate
  };
};
