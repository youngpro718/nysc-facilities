          import { useState, useEffect, useMemo } from "react";
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
import { useDebouncedInventorySearch } from "@/hooks/optimized/useOptimizedInventory";

interface InventoryPageProps {
  roomId?: string;
}

export function InventoryPage({ roomId }: InventoryPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Optimized debounced server-side search (2+ chars)
  const { data: searchResults = [], isLoading: isSearchLoading } = useDebouncedInventorySearch(searchQuery, 300);

  // Decide which items to show
  const itemsToShow = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length >= 2) {
      if ((searchResults as any[])?.length > 0) return searchResults as any[];
      // Fallback to all items when no matches
      return items;
    }
    return items;
  }, [items, searchResults, searchQuery]);

  // Pagination derived values
  const total = itemsToShow.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return itemsToShow.slice(start, end);
  }, [itemsToShow, page, pageSize]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("id, name, color")
        .order("name");

      if (error) {
        throw error;
      }
      return data || [];
    },
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });


  // Client-side filter fallback removed in favor of server-side search for accuracy/perf

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
        {isSearchLoading && searchQuery.trim().length >= 2 && (
          <div className="text-xs text-muted-foreground mt-2">Searching…</div>
        )}
        {!isSearchLoading && searchQuery.trim().length >= 2 && (searchResults as any[])?.length === 0 && (
          <div className="text-xs text-muted-foreground mt-2">No matches. Showing all items.</div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? (
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, total)}–
              {Math.min(page * pageSize, total)} of {total}
            </span>
          ) : (
            <span>No results</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Rows:</label>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || (isLoading || isUpdating || isDeleting)}
            >
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || (isLoading || isUpdating || isDeleting)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <InventoryTable
        items={pagedItems}
        categories={categories}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        isLoading={(isLoading || isUpdating || isDeleting) || (isSearchLoading && searchQuery.trim().length >= 2)}
      />
    </div>
  );
}
