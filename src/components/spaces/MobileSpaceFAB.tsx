import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuickSpaceBottomSheet } from './QuickSpaceBottomSheet';
import { useSpaceContext } from '@/hooks/useSpaceContext';
import { motion, AnimatePresence } from 'framer-motion';

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
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            delay: 0.2 
          }}
          className="fixed bottom-20 right-4 z-50 md:hidden safe-area-bottom"
        >
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg group active:scale-95 transition-transform touch-manipulation"
            onClick={() => setIsOpen(true)}
            aria-label="Add new space"
          >
            <Plus className="h-6 w-6" />
            {hasContext && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                ✓
              </Badge>
            )}
          </Button>
        </motion.div>
      </AnimatePresence>

      <QuickSpaceBottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        preselectedBuilding={buildingId}
        preselectedFloor={floorId}
      />
    </>
  );
}
