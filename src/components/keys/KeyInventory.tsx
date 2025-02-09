import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface KeyInventoryData {
  id: string;
  key_id: string;
  quantity: number | null;
  expected_quantity: number | null;
  discrepancy_notes: string | null;
  created_at: string;
  updated_at: string;
  last_audit_date: string | null;
  last_audited_by: string | null;
  profiles: {
    username: string | null;
  } | null;
}

interface KeyInventoryProps {
  keyId: string;
}

export function KeyInventory({ keyId }: KeyInventoryProps) {
  const { data: inventoryItems } = useQuery({
    queryKey: ['key-inventory', keyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_inventory')
        .select(`
          *,
          profiles:last_audited_by (
            username
          )
        `)
        .eq('key_id', keyId);

      if (error) throw error;
      return data as KeyInventoryData[];
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
          {inventoryItems?.map((item) => (
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