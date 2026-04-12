import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface OrderConfirmationProps {
  order: {
    id?: string;
    title?: string;
    status?: string;
    approval_required?: boolean;
  };
  onPlaceAnother: () => void;
}

export function OrderConfirmation({ order, onPlaceAnother }: OrderConfirmationProps) {
  const navigate = useNavigate();

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Order Submitted!</h1>
        <p className="text-muted-foreground">
          {order.approval_required
            ? "Your order requires approval. You'll be notified when it's reviewed."
            : "Your order is being processed. You'll be notified when it's ready."}
        </p>
      </div>

      <Card className="p-4">
        <h3 className="font-medium mb-2">Order Summary</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          {order.id && <p>Order #{order.id.slice(0, 8)}</p>}
          {order.title && <p>{order.title}</p>}
          {order.status && <p>Status: {order.status}</p>}
        </div>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => navigate('/my-supply-requests')}>
          Track My Orders
        </Button>
        <Button onClick={onPlaceAnother}>
          Place Another Order
        </Button>
      </div>
    </div>
  );
}
