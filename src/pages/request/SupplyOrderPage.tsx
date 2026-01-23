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
    <div className="container max-w-3xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order Supplies</h1>
          <p className="text-muted-foreground text-sm">Add items to your cart and submit</p>
        </div>
      </div>

      {/* Quick Supply Request Component */}
      <div className="flex-1 overflow-hidden">
        <QuickSupplyRequest />
      </div>
    </div>
  );
}
