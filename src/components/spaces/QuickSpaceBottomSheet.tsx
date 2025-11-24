import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { QuickSpaceTemplates } from './QuickSpaceTemplates';
import { Badge } from '@/components/ui/badge';
import { Building2, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface QuickSpaceBottomSheetProps {
  open: boolean;
  onClose: () => void;
  preselectedBuilding?: string;
  preselectedFloor?: string;
}

export function QuickSpaceBottomSheet({ 
  open, 
  onClose, 
  preselectedBuilding, 
  preselectedFloor 
}: QuickSpaceBottomSheetProps) {
  // Fetch building and floor names for context display
  const { data: building } = useQuery({
    queryKey: ['building', preselectedBuilding],
    queryFn: async () => {
      if (!preselectedBuilding) return null;
      const { data } = await supabase
        .from('buildings')
        .select('name')
        .eq('id', preselectedBuilding)
        .single();
      return data;
    },
    enabled: !!preselectedBuilding
  });

  const { data: floor } = useQuery({
    queryKey: ['floor', preselectedFloor],
    queryFn: async () => {
      if (!preselectedFloor) return null;
      const { data } = await supabase
        .from('floors')
        .select('name')
        .eq('id', preselectedFloor)
        .single();
      return data;
    },
    enabled: !!preselectedFloor
  });

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Add New Space</SheetTitle>
            {(building || floor) && (
              <div className="flex gap-2">
                {building && (
                  <Badge variant="secondary" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {building.name}
                  </Badge>
                )}
                {floor && (
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    {floor.name}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <QuickSpaceTemplates
            onClose={onClose}
            preselectedBuilding={preselectedBuilding}
            preselectedFloor={preselectedFloor}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
