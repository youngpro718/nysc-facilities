
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { StockTransaction } from "../types/KeyTypes";

export function KeyStockHistory({ keyId }: { keyId: string }) {
  const [error, setError] = useState<string | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["keyStockTransactions", keyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_stock_transactions")
        .select(`
          id,
          transaction_type,
          quantity,
          reason,
          notes,
          created_at,
          performed_by,
          profiles:profiles!performed_by(
            username
          )
        `)
        .eq("key_id", keyId)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return [];
      }

      return data as unknown as StockTransaction[];
    },
  });

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Badge
                  variant={
                    transaction.transaction_type === "add"
                      ? "default"
                      : transaction.transaction_type === "remove"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {transaction.transaction_type}
                </Badge>
              </TableCell>
              <TableCell>{transaction.quantity}</TableCell>
              <TableCell>{transaction.reason || "N/A"}</TableCell>
              <TableCell>
                {transaction.profiles?.username || "System"}
              </TableCell>
              <TableCell>
                {format(new Date(transaction.created_at), "MMM d, yyyy HH:mm")}
              </TableCell>
            </TableRow>
          ))}
          {!transactions?.length && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground h-24"
              >
                No stock transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
