/**
 * SupplyOrderPage - Streamlined supply ordering experience
 * 
 * Uses the new QuickSupplyRequest component with:
 * - Inline quantity controls (no modals)
 * - Favorites strip for common items
 * - Conditional justification (only for flagged items)
 * - Sticky order summary footer
 */

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { QuickSupplyRequest } from '@/components/supply/QuickSupplyRequest';

export default function SupplyOrderPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-2 sm:pt-6 h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-8rem)] flex flex-col overflow-x-hidden max-w-full">
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

      {/* Quick Supply Request Component */}
      <div className="flex-1 min-h-0">
        <QuickSupplyRequest />
      </div>
    </div>
  );
}
