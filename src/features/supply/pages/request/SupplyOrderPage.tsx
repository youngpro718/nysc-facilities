/**
 * SupplyOrderPage - Streamlined supply ordering experience
 * 
 * Desktop: List view with detail panel (image + info shown on item click)
 * Mobile: Card-based browsing with inline controls
 */

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@shared/hooks/use-mobile';
import { QuickSupplyRequest } from '@features/supply/components/supply/QuickSupplyRequest';
import { QuickOrderGrid } from '@features/supply/components/supply/QuickOrderGrid';

export default function SupplyOrderPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className={`mx-auto px-3 sm:px-4 pt-2 sm:pt-6 flex flex-col overflow-x-hidden ${isMobile ? 'max-w-3xl h-[calc(100svh-10rem)]' : 'max-w-5xl h-[calc(100svh-8rem)]'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0 h-9 w-9 touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg sm:text-2xl font-bold truncate">Order Supplies</h1>
      </div>

      {/* Desktop: List + Detail Panel | Mobile: Card-based browsing */}
      <div className="flex-1 min-h-0">
        {isMobile ? <QuickSupplyRequest /> : <QuickOrderGrid />}
      </div>
    </div>
  );
}
