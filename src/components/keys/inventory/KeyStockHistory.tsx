import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { StockTransaction } from "../types/KeyTypes";

interface KeyStockHistoryProps {
  keyId: string;
}

export function KeyStockHistory({ keyId }: KeyStockHistoryProps) {
  const { data: transactions } = useQuery({
    queryKey: ["key-stock-history", keyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_stock_transactions")
        .select("*")
        .eq("key_id", keyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StockTransaction[];
    },
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Stock History</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{format(new Date(transaction.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                <TableCell>{transaction.quantity}</TableCell>
                <TableCell>{transaction.transaction_type}</TableCell>
                <TableCell>{transaction.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
