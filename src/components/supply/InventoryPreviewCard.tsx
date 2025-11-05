import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InventoryPreviewCardProps {
  orderId: string;
  orderItems: any[];
}

export function InventoryPreviewCard({ orderId, orderItems }: InventoryPreviewCardProps) {
  const { data: inventoryPreview, isLoading } = useQuery({
    queryKey: ['inventory-preview', orderId],
    queryFn: async () => {
      const itemIds = orderItems.map(item => item.item_id);
      
      // Fetch current inventory levels
      const { data: inventory, error } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, minimum_quantity, unit')
        .in('id', itemIds);

      if (error) throw error;

      // Calculate preview
      return inventory?.map(inv => {
        const orderItem = orderItems.find(item => item.item_id === inv.id);
        const requestedQty = orderItem?.quantity_requested || 0;
        const afterStock = inv.quantity - requestedQty;
        const isInsufficient = afterStock < 0;
        const isBelowMinimum = afterStock < (inv.minimum_quantity || 0);

        return {
          id: inv.id,
          name: inv.name,
          currentStock: inv.quantity,
          requestedQty,
          afterStock,
          unit: inv.unit,
          minimumQuantity: inv.minimum_quantity,
          isInsufficient,
          isBelowMinimum,
        };
      });
    },
    enabled: orderItems.length > 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasWarnings = inventoryPreview?.some(item => item.isInsufficient || item.isBelowMinimum);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Inventory Impact Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasWarnings && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some items have stock concerns. Review before proceeding.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {inventoryPreview?.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${
                item.isInsufficient
                  ? 'bg-destructive/5 border-destructive/30'
                  : item.isBelowMinimum
                  ? 'bg-warning/5 border-warning/30'
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{item.name}</span>
                {item.isInsufficient && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Insufficient
                  </Badge>
                )}
                {!item.isInsufficient && item.isBelowMinimum && (
                  <Badge variant="outline" className="text-xs bg-warning/10">
                    Below Minimum
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{item.currentStock} {item.unit}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span
                  className={`font-medium ${
                    item.isInsufficient
                      ? 'text-destructive'
                      : item.isBelowMinimum
                      ? 'text-warning'
                      : 'text-success'
                  }`}
                >
                  {item.afterStock} {item.unit}
                </span>
                <span className="text-muted-foreground text-xs">
                  (-{item.requestedQty})
                </span>
              </div>

              {item.isBelowMinimum && !item.isInsufficient && (
                <div className="text-xs text-muted-foreground mt-1">
                  Minimum: {item.minimumQuantity} {item.unit}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
