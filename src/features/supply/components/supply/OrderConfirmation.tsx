import { CheckCircle, Clock, MapPin, Package, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface OrderConfirmationProps {
  order: {
    id?: string;
    title?: string;
    status?: string;
    approval_required?: boolean;
    approval_reason?: string | null;
    delivery_location?: string;
    priority?: string;
    items?: Array<{ item_name?: string; quantity?: number; item_unit?: string }>;
  };
  onPlaceAnother: () => void;
}

export function OrderConfirmation({ order, onPlaceAnother }: OrderConfirmationProps) {
  const navigate = useNavigate();
  const needsApproval = !!order.approval_required;

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-5">
      <div className="text-center space-y-3">
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            needsApproval
              ? 'bg-amber-100 dark:bg-amber-950'
              : 'bg-green-100 dark:bg-green-950'
          }`}
        >
          {needsApproval ? (
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          )}
        </div>
        <h1 className="text-2xl font-bold">
          {needsApproval ? 'Sent for approval' : 'Order submitted!'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {needsApproval
            ? (order.approval_reason
                ? `${order.approval_reason}. A supervisor will review it — typical wait under one business day.`
                : "A supervisor will review your order — typical wait under one business day.")
            : "Supply staff will pick your order and notify you when it's ready for pickup."}
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Request</div>
            <div className="font-medium text-sm truncate">{order.title || 'Supply request'}</div>
            {order.id && (
              <div className="text-xs text-muted-foreground mt-0.5">
                #{order.id.slice(0, 8)}
              </div>
            )}
          </div>
          <Badge variant={needsApproval ? 'outline' : 'secondary'} className="shrink-0">
            {needsApproval ? 'Pending approval' : (order.status || 'submitted')}
          </Badge>
        </div>

        {order.delivery_location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Deliver to</span>
            <span className="font-medium">{order.delivery_location}</span>
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <div className="pt-2 border-t space-y-1.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </div>
            <ul className="space-y-1 text-sm">
              {order.items.slice(0, 6).map((it, idx) => (
                <li key={idx} className="flex justify-between gap-2">
                  <span className="truncate">{it.item_name}</span>
                  <span className="tabular-nums text-muted-foreground shrink-0">
                    × {it.quantity}
                  </span>
                </li>
              ))}
              {order.items.length > 6 && (
                <li className="text-xs text-muted-foreground">
                  + {order.items.length - 6} more
                </li>
              )}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => navigate('/my-supply-requests')}>
          Track my orders
        </Button>
        <Button onClick={onPlaceAnother}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Place another order
        </Button>
      </div>
    </div>
  );
}
