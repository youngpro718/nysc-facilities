import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuickSpaceBottomSheet } from './QuickSpaceBottomSheet';

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

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <QuickSpaceBottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        preselectedBuilding={preselectedBuilding}
        preselectedFloor={preselectedFloor}
      />
    </>
  );
}
