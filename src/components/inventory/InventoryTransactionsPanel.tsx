import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Search, Plus, Minus, RotateCw, Filter } from "lucide-react";
import { format } from "date-fns";

type Transaction = {
  id: string;
  item_name: string;
  transaction_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string;
  created_at: string;
  performed_by: string;
};

export const InventoryTransactionsPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Realtime handled by global RealtimeProvider; queries are invalidated centrally

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["inventory-transactions", searchQuery, typeFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("inventory_item_transactions")
        .select(`
          id,
          transaction_type,
          quantity,
          previous_quantity,
          new_quantity,
          notes,
          created_at,
          performed_by,
          inventory_items!inner(name)
        `)
        .order("created_at", { ascending: false });

      // Apply filters
      if (typeFilter !== "all") {
        query = query.eq("transaction_type", typeFilter);
      }

      if (dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return data?.map(t => ({
        id: t.id,
        item_name: (t.inventory_items as Record<string, unknown>)?.name || "Unknown Item",
        transaction_type: t.transaction_type,
        quantity: t.quantity,
        previous_quantity: t.previous_quantity,
        new_quantity: t.new_quantity,
        notes: t.notes,
        created_at: t.created_at,
        performed_by: t.performed_by,
      })).filter(t => 
        !searchQuery || t.item_name.toLowerCase().includes(searchQuery.toLowerCase())
      ) as Transaction[];
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "add": return <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "remove": return <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "adjustment": return <RotateCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default: return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "add": return "bg-green-100 dark:bg-green-900/30 text-green-800";
      case "remove": return "bg-red-100 dark:bg-red-900/30 text-red-800";
      case "adjustment": return "bg-blue-100 dark:bg-blue-900/30 text-blue-800";
      default: return "bg-gray-100 dark:bg-gray-800/30 text-gray-800";
    }
  };

  const getQuantityDisplay = (transaction: Transaction) => {
    const { transaction_type, quantity, previous_quantity, new_quantity } = transaction;
    
    switch (transaction_type) {
      case "add":
        return `+${quantity} (${previous_quantity} → ${new_quantity})`;
      case "remove":
        return `-${quantity} (${previous_quantity} → ${new_quantity})`;
      case "adjustment":
        return `Set to ${new_quantity} (was ${previous_quantity})`;
      default:
        return `${quantity}`;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-muted-foreground">Track all inventory movements and changes</p>
        </div>
      </div>

      {/* Filters - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background z-50">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="add">Added Stock</SelectItem>
            <SelectItem value="remove">Removed Stock</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-background z-50">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions?.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Start adding, removing, or adjusting inventory to see transaction history here."
              }
            </p>
          </Card>
        ) : (
          transactions?.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{getQuantityDisplay(transaction)}</p>
                      <Badge className={getTransactionColor(transaction.transaction_type)}>
                        {transaction.transaction_type}
                      </Badge>
                    </div>
                  </div>
                </div>

                {transaction.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes: </span>
                      {transaction.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {transactions && transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {transactions.filter(t => t.transaction_type === "add").length}
                </p>
                <p className="text-sm text-muted-foreground">Stock Added</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {transactions.filter(t => t.transaction_type === "remove").length}
                </p>
                <p className="text-sm text-muted-foreground">Stock Removed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {transactions.filter(t => t.transaction_type === "adjustment").length}
                </p>
                <p className="text-sm text-muted-foreground">Adjustments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};