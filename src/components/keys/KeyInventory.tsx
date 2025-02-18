import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyData } from "./types/KeyTypes";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function KeyInventory() {
  const { data: keys, isLoading } = useQuery({
    queryKey: ["keys-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_inventory_view")
        .select("*");

      if (error) throw error;
      return data as KeyData[];
    },
  });

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Key ID</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Expected Quantity</TableHead>
            <TableHead>Discrepancy Notes</TableHead>
            <TableHead>Last Audited By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys?.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.key_id}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.expected_quantity}</TableCell>
              <TableCell>{item.discrepancy_notes || 'N/A'}</TableCell>
              <TableCell>{item.profiles?.username || 'N/A'}</TableCell>
              <TableCell>
                <Button variant="outline">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default KeyInventory;
