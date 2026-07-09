import { Button } from '@/components/ui/button';
import { Bell, Package, Truck, ChevronRight } from 'lucide-react';

interface PickupAlertBannerProps {
  count: number;
  onClick?: () => void;
  /** Delivery method of the ready order(s) this banner represents — controls
   * copy ("ready for pickup" vs "on its way"). Defaults to 'pickup' for
   * callers that haven't split by delivery method. */
  deliveryMethod?: 'pickup' | 'delivery';
}

export function PickupAlertBanner({ count, onClick, deliveryMethod = 'pickup' }: PickupAlertBannerProps) {
  if (count === 0) return null;

  const isDelivery = deliveryMethod === 'delivery';

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
            {isDelivery ? <Truck className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            {isDelivery
              ? (count === 1 ? '1 Order On Its Way' : `${count} Orders On Their Way`)
              : (count === 1 ? '1 Order Ready for Pickup' : `${count} Orders Ready for Pickup`)}
          </div>
          <p className="text-sm opacity-90">
            {isDelivery
              ? 'Your supplies will be delivered to your room'
              : 'Your supplies are waiting at the Supply Room'}
          </p>
        </div>
      </div>
      <Button variant="secondary" size="sm" className="flex-shrink-0">
        View <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
