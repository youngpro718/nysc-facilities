import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingDown, 
  TrendingUp, 
  User, 
  Clock,
  Package,
  RefreshCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  performed_by: string;
  notes: string;
  created_at: string;
  inventory_items: {
    name: string;
    sku: string;
    unit: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface InventoryActivityLogProps {
  itemId?: string; // If provided, show only transactions for this item
  limit?: number;
}

export function InventoryActivityLog({ itemId, limit = 50 }: InventoryActivityLogProps) {
  const [showAll, setShowAll] = useState(false);

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['inventory-transactions', itemId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_item_transactions')
        .select(`
          *,
          inventory_items (
            name,
            sku,
            unit
          ),
          profiles:performed_by (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(showAll ? 200 : limit);

      if (itemId) {
        query = query.eq('item_id', itemId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InventoryTransaction[];
    },
    // refetchInterval disabled
  });

  const getTransactionIcon = (type: string) => {
    if (type === 'add' || type === 'restock' || type === 'adjustment_increase') {
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };

  const getTransactionBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: unknown }> = {
      'add': { label: 'Added', variant: 'default' },
      'remove': { label: 'Removed', variant: 'destructive' },
      'fulfilled': { label: 'Fulfilled Order', variant: 'secondary' },
      'restock': { label: 'Restocked', variant: 'default' },
      'adjustment_increase': { label: 'Adjusted +', variant: 'default' },
      'adjustment_decrease': { label: 'Adjusted -', variant: 'destructive' },
    };

    const config = typeMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getQuantityDisplay = (transaction: InventoryTransaction) => {
    const change = transaction.new_quantity - transaction.previous_quantity;
    const isIncrease = change > 0;
    
    return (
      <div className="text-right">
        <div className={`text-lg font-semibold ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isIncrease ? '+' : ''}{change} {transaction.inventory_items?.unit || 'units'}
        </div>
        <div className="text-xs text-muted-foreground">
          {transaction.previous_quantity} → {transaction.new_quantity}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Inventory Activity Log
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading activity...
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getTransactionIcon(transaction.transaction_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">
                          {transaction.inventory_items?.name || 'Unknown Item'}
                        </h4>
                        {getTransactionBadge(transaction.transaction_type)}
                      </div>
                      {transaction.inventory_items?.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {transaction.inventory_items.sku}
                        </p>
                      )}
                    </div>
                    {getQuantityDisplay(transaction)}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {transaction.profiles && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {transaction.profiles.first_name} {transaction.profiles.last_name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {transaction.notes && (
                    <div className="mt-2 text-sm text-muted-foreground italic">
                      "{transaction.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show More Button */}
            {transactions.length >= limit && !showAll && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                >
                  Show More Activity
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
