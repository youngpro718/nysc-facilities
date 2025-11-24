import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuickSpaceBottomSheet } from './QuickSpaceBottomSheet';
import { useSpaceContext } from '@/hooks/useSpaceContext';

interface MobileSpaceFABProps {
  preselectedBuilding?: string;
  preselectedFloor?: string;
}

export function MobileSpaceFAB({ 
  preselectedBuilding, 
  preselectedFloor 
}: MobileSpaceFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const context = useSpaceContext();

  // Use preselected values or context
  const buildingId = preselectedBuilding || context.buildingId || undefined;
  const floorId = preselectedFloor || context.floorId || undefined;

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  const hasContext = !!(buildingId || floorId);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden group"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-6 w-6" />
        {hasContext && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
          >
            ✓
          </Badge>
        )}
      </Button>

      <QuickSpaceBottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        preselectedBuilding={buildingId}
        preselectedFloor={floorId}
      />
    </>
  );
}
