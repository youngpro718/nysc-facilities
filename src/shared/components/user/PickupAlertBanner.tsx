import { Button } from '@/components/ui/button';
import { Bell, Package, ChevronRight } from 'lucide-react';

interface PickupAlertBannerProps {
  count: number;
  onClick?: () => void;
}

export function PickupAlertBanner({ count, onClick }: PickupAlertBannerProps) {
  if (count === 0) return null;

  return (
    <div 
      className="bg-warning text-warning-foreground rounded-lg p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-warning/90 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-warning-foreground/10 rounded-full">
          <Bell className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            {count === 1 ? '1 Order Ready for Pickup' : `${count} Orders Ready for Pickup`}
          </div>
          <p className="text-sm opacity-90">
            Your supplies are waiting at the Supply Room
          </p>
        </div>
      </div>
      <Button variant="secondary" size="sm" className="flex-shrink-0">
        View <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
