import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Power, PowerOff, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ZoneControlsProps {
  zoneId: string;
  zoneName: string;
  zoneType: string;
}

export function ZoneControls({ zoneId, zoneName, zoneType }: ZoneControlsProps) {
  const queryClient = useQueryClient();

  const { data: fixturesInZone } = useQuery({
    queryKey: ['zone-fixtures', zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, status')
        .eq('zone_id', zoneId);
      
      if (error) throw error;
      return data;
    },
  });

  const handleUpdateZoneFixtures = async (status: 'functional' | 'non_functional') => {
    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({ status })
        .eq('zone_id', zoneId);

      if (error) throw error;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['zone-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });

      toast.success(`All fixtures in ${zoneName} ${status === 'functional' ? 'turned on' : 'turned off'}`);
    } catch (error: any) {
      console.error('Error updating zone fixtures:', error);
      toast.error(error.message || "Failed to update zone fixtures");
    }
  };

  const allFunctional = fixturesInZone?.every(f => f.status === 'functional');
  const allNonFunctional = fixturesInZone?.every(f => f.status === 'non_functional');
  const hasFixtures = fixturesInZone && fixturesInZone.length > 0;

  if (!hasFixtures) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {zoneType === 'emergency' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={allFunctional ? 'bg-green-100' : ''}
            >
              <Power className="h-4 w-4 mr-2" />
              Turn All On
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Emergency Zone Control</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to turn on all fixtures in an emergency lighting zone.
                Please confirm this action is necessary.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleUpdateZoneFixtures('functional')}>
                Turn On
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {zoneType !== 'emergency' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateZoneFixtures('functional')}
          className={allFunctional ? 'bg-green-100' : ''}
        >
          <Power className="h-4 w-4 mr-2" />
          Turn All On
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleUpdateZoneFixtures('non_functional')}
        className={allNonFunctional ? 'bg-red-100' : ''}
      >
        <PowerOff className="h-4 w-4 mr-2" />
        Turn All Off
      </Button>
    </div>
  );
} 