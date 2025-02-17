import { useState } from "react";
import { useInventory } from "./inventory/hooks/useInventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Package, Search, Download, Upload, Pencil } from "lucide-react";
import { AddInventoryDialog } from "./inventory/AddInventoryDialog";
import { EditInventoryDialog } from "./inventory/EditInventoryDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryFormInputs, InventoryItem } from "./inventory/types/inventoryTypes";
import { exportToExcel, parseExcelFile } from "./inventory/excelUtils";

export function RoomInventory({ roomId }: { roomId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  
  const {
    inventory,
    isLoading,
    addItem,
    editItem,
    updateQuantity,
    deleteItem,
    isAddingItem,
    isEditingItem,
    isUpdatingQuantity,
    isDeletingItem,
    addBulkItems
  } = useInventory(roomId);

  const filteredInventory = inventory?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (data: InventoryFormInputs) => {
    try {
      await addItem({
        ...data,
        storage_room_id: roomId,
        status: 'active',
        quantity: data.quantity || 0
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: InventoryFormInputs) => {
    if (!selectedItem) return;

    try {
      await editItem({
        id: selectedItem.id,
        ...data,
        storage_room_id: roomId,
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!inventory) return;
    
    const exportData = inventory.map(item => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category?.name || 'General',
      description: item.description || '',
      minimum_quantity: item.minimum_quantity || 0,
      unit: item.unit || '',
      location_details: item.location_details || '',
      notes: item.notes || ''
    }));

    exportToExcel(exportData, `inventory_${new Date().toISOString().split('T')[0]}`);
    toast({
      title: "Success",
      description: "Inventory exported successfully",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      
      // Transform the data to match our database schema
      const itemsToImport = data.map(item => ({
        name: item.name,
        quantity: item.quantity,
        description: item.description,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        storage_room_id: roomId,
        status: 'active' as const,
        location_details: item.location_details,
        notes: item.notes
      }));

      await addBulkItems(itemsToImport);

      toast({
        title: "Success",
        description: `Imported ${data.length} items successfully.`,
      });
      event.target.value = ''; // Reset file input
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import inventory data.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.category && (
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${item.category.color}20`,
                          borderColor: item.category.color,
                        }}
                      >
                        {item.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity({
                          id: item.id,
                          quantity: item.quantity - 1
                        })}
                        disabled={item.quantity <= 0 || isUpdatingQuantity}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity({
                          id: item.id,
                          quantity: item.quantity + 1
                        })}
                        disabled={isUpdatingQuantity}
                      >
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.quantity <= (item.minimum_quantity || 0) ? "destructive" : "default"}
                    >
                      {item.quantity <= (item.minimum_quantity || 0) ? "Low Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedItem(item);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this item?')) {
                              deleteItem(item.id);
                            }
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (!filteredInventory || filteredInventory.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={isAddingItem}
      />
      {selectedItem && (
        <EditInventoryDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEdit}
          isSubmitting={isEditingItem}
          initialData={selectedItem}
        />
      )}
    </Card>
  );
}
