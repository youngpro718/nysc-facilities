          import { useState, useEffect } from "react";
import { useInventory, type InventoryItem } from "./hooks/useInventory";
import { InventoryTable } from "./InventoryTable";
import { InventoryForm } from "./InventoryForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InventoryPageProps {
  roomId?: string;
}

export function InventoryPage({ roomId }: InventoryPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    isCreating,
    isUpdating,
    isDeleting,
  } = useInventory({ roomId });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("Fetching categories...");
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("id, name, color")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      console.log("Categories fetched:", data);
      return data || [];
    },
  });

  // Log categories whenever they change
  useEffect(() => {
    console.log("Current categories:", categories);
  }, [categories]);

  // Filter items based on search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateItem = async (data: any) => {
    await createItem(data);
    setIsAddDialogOpen(false);
  };

  const handleUpdateItem = async (id: string, data: Partial<InventoryItem>) => {
    await updateItem({ ...data, id });
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <InventoryForm
              onSubmit={handleCreateItem}
              categories={categories}
              isLoading={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <InventoryTable
        items={filteredItems}
        categories={categories}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        isLoading={isLoading || isUpdating || isDeleting}
      />
    </div>
  );
}
