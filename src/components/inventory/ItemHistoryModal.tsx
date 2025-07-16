import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, TrendingUp, TrendingDown, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ItemHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
}

interface TransactionRecord {
  id: string;
  transaction_type: string;
  quantity: number;
  new_quantity: number;
  previous_quantity: number;
  notes?: string;
  performed_by?: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
}

export function ItemHistoryModal({
  open,
  onOpenChange,
  itemId,
  itemName,
}: ItemHistoryModalProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['inventory-transactions', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_item_transactions')
        .select(`
          *,
          profiles:performed_by(
            first_name,
            last_name
          )
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TransactionRecord[];
    },
    enabled: open,
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'remove':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'adjustment':
        return <History className="h-4 w-4 text-blue-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'add':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'remove':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'adjustment':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTransactionDescription = (transaction: TransactionRecord) => {
    const userName = transaction.profile 
      ? `${transaction.profile.first_name} ${transaction.profile.last_name}`
      : 'Unknown User';

    switch (transaction.transaction_type) {
      case 'add':
        return `${userName} added ${transaction.quantity} items`;
      case 'remove':
        return `${userName} removed ${transaction.quantity} items`;
      case 'adjustment':
        return `${userName} adjusted quantity by ${transaction.quantity > 0 ? '+' : ''}${transaction.quantity}`;
      default:
        return `${userName} updated quantity`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History - {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading history...</p>
              </div>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {getTransactionDescription(transaction)}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={getTransactionColor(transaction.transaction_type)}
                          >
                            {transaction.transaction_type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(transaction.created_at), { 
                                addSuffix: true 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              {transaction.profile 
                                ? `${transaction.profile.first_name} ${transaction.profile.last_name}`
                                : 'Unknown User'
                              }
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Quantity: {transaction.previous_quantity} → {transaction.new_quantity}
                        </div>

                        {transaction.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <strong>Notes:</strong> {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transaction history found</p>
              <p className="text-sm">Changes to this item will appear here</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}