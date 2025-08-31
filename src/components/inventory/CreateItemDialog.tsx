import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FormButtons } from "@/components/ui/form-buttons";

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type StorageRoom = {
  id: string;
  name: string;
  room_number: string;
};

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateItemDialog = ({ open, onOpenChange }: CreateItemDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    minimum_quantity: "",
    unit: "",
    category_id: "",
    storage_room_id: "",
    location_details: "",
    preferred_vendor: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: storageRooms } = useQuery({
    queryKey: ["storage-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number, original_room_type, temporary_storage_use")
        .eq("is_storage", true)
        .order("room_number");
      if (error) throw error;
      return data as StorageRoom[];
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("inventory_items")
        .insert({
          name: data.name,
          description: data.description || null,
          quantity: parseInt(data.quantity) || 0,
          minimum_quantity: parseInt(data.minimum_quantity) || 0,
          unit: data.unit || null,
          category_id: data.category_id || null,
          storage_room_id: data.storage_room_id || null,
          location_details: data.location_details || null,
          preferred_vendor: data.preferred_vendor || null,
          notes: data.notes || null,
          status: "active",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast({
        title: "Item created",
        description: "Inventory item has been created successfully.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create item: " + error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Missing field",
        description: "Item name is required.",
      });
      return;
    }

    createItemMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      quantity: "",
      minimum_quantity: "",
      unit: "",
      category_id: "",
      storage_room_id: "",
      location_details: "",
      preferred_vendor: "",
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., pieces, boxes, kg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the item"
                rows={2}
              />
            </div>
          </div>

          {/* Quantity & Category */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quantity & Category</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quantity">Minimum Quantity</Label>
                <Input
                  id="minimum_quantity"
                  type="number"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location</h3>
            
            <div className="space-y-2">
              <Label htmlFor="storage_room">Storage Room</Label>
              <Select
                value={formData.storage_room_id}
                onValueChange={(value) => setFormData({ ...formData, storage_room_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a storage room" />
                </SelectTrigger>
                <SelectContent>
                  {storageRooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.room_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_details">Location Details</Label>
              <Input
                id="location_details"
                value={formData.location_details}
                onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                placeholder="e.g., Shelf A-3, Cabinet 2"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="preferred_vendor">Preferred Vendor</Label>
              <Input
                id="preferred_vendor"
                value={formData.preferred_vendor}
                onChange={(e) => setFormData({ ...formData, preferred_vendor: e.target.value })}
                placeholder="Vendor or supplier name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
          </div>

          <FormButtons
            onCancel={handleClose}
            isSubmitting={createItemMutation.isPending}
            submitLabel="Create Item"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};