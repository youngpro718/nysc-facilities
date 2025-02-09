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
import { Button } from "@/components/ui/button";
import { Package, Plus, History, Trash2 } from "lucide-react";
import { KeyStockAdjustment } from "../inventory/KeyStockAdjustment";
import { CreateKeyDialog } from "../CreateKeyDialog";
import { KeyData } from "../types/KeyTypes";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function KeyInventorySection() {
  const [keyToDelete, setKeyToDelete] = useState<KeyData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: keys, isLoading, refetch } = useQuery({
    queryKey: ["keys-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select(`
          id,
          name,
          type,
          status,
          total_quantity,
          available_quantity,
          is_passkey
        `)
        .order('name');

      if (error) throw error;
      return data as KeyData[];
    },
  });

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      const { error } = await supabase.rpc('safely_delete_key', {
        key_id_to_delete: keyToDelete.id
      });

      if (error) {
        if (error.message.includes('active assignments')) {
          toast.error("Cannot delete key with active assignments");
        } else {
          toast.error("Error deleting key: " + error.message);
        }
        return;
      }

      toast.success("Key deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Error deleting key: " + error.message);
    } finally {
      setKeyToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Key Inventory</h2>
          <p className="text-muted-foreground">Manage your key stock and inventory</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Key
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys?.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {key.name}
                    {key.is_passkey && (
                      <Badge variant="secondary">Passkey</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{key.type}</Badge>
                </TableCell>
                <TableCell>{key.total_quantity}</TableCell>
                <TableCell>{key.available_quantity}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      key.status === "available" 
                        ? "default" 
                        : key.status === "assigned" 
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {key.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <KeyStockAdjustment keyId={key.id} keyName={key.name} />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setKeyToDelete(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateKeyDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {keyToDelete?.name}? This action cannot be undone.
              Keys with active assignments cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}