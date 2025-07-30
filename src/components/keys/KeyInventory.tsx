
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeyData } from "./types/KeyTypes";

export function KeyInventory() {
  const { data: keys, isLoading } = useQuery({
    queryKey: ["keys-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("*");

      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Total Stock</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys?.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.total_quantity}</TableCell>
              <TableCell>{item.available_quantity}</TableCell>
              <TableCell>{item.status}</TableCell>
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
