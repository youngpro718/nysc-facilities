import { useState, useRef, useEffect } from "react";
import { logger } from '@/lib/logger';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@shared/hooks/use-toast";
import { STORAGE_BUCKETS, QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { useCatalogMatches } from "./hooks/useCatalogMatches";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  minimum_quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  location_details: z.string().optional(),
  preferred_vendor: z.string().optional(),
  notes: z.string().optional(),
});

export interface InventoryFormInputs {
  name: string;
  description?: string;
  quantity: number;
  minimum_quantity?: number;
  unit?: string;
  category_id: string;
  location_details?: string;
  preferred_vendor?: string;
  notes?: string;
  photo_url?: string;
  catalog_item_id?: string | null;
}

interface MobileAddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InventoryFormInputs) => Promise<void>;
  isSubmitting: boolean;
  /** The room this item is being added to (auto-assigned, not user-editable here). */
  roomId?: string;
  roomName?: string;
}

export function MobileAddInventoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  roomId,
  roomName,
}: MobileAddInventoryDialogProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [linkedCatalogId, setLinkedCatalogId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<InventoryFormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: 0,
      minimum_quantity: 0,
      unit: "",
      category_id: "",
      location_details: "",
      preferred_vendor: "",
      notes: "",
    },
  });

  const { data: categories } = useQuery({
    queryKey: QUERY_KEYS.inventoryCategories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: QUERY_CONFIG.stale.long,
    gcTime: QUERY_CONFIG.gc.long,
  });

  const nameValue = form.watch("name");
  const { data: catalogMatches } = useCatalogMatches(nameValue, roomId);

  useEffect(() => {
    setLinkedCatalogId(null);
  }, [catalogMatches]);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingPhoto(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.inventoryPhotos)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.inventoryPhotos)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      logger.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoCapture = (file: File) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (data: InventoryFormInputs) => {
    try {
      let photoUrl = null;

      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      await onSubmit({
        ...data,
        photo_url: photoUrl || undefined,
        catalog_item_id: linkedCatalogId,
      });

      // Reset form and photo state
      form.reset();
      removePhoto();
      setLinkedCatalogId(null);
    } catch (error) {
      logger.error('Error submitting form:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      removePhoto();
      setLinkedCatalogId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <ModalFrame open={open} onOpenChange={handleOpenChange} size="md" title="Add New Item">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

              {roomName && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Adding to: </span>
                  <span className="font-medium">{roomName}</span>
                </div>
              )}

              {/* Photo Section */}
              <div className="space-y-3">
                <FormLabel>Item Photo</FormLabel>
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Item preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex-col gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-sm">Take Photo</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Upload Photo</span>
                    </Button>
                  </div>
                )}
                
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoCapture(file);
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoCapture(file);
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Item name" 
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {catalogMatches && catalogMatches.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 space-y-2 text-sm">
                  <p className="font-medium">Already stocked in other rooms</p>
                  {catalogMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between gap-2">
                      <span>
                        {match.room_name || "Unknown room"}
                        {match.room_number ? ` (${match.room_number})` : ""}: {match.quantity} in stock
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={linkedCatalogId === match.id ? "default" : "outline"}
                        onClick={() =>
                          setLinkedCatalogId((prev) => (prev === match.id ? null : match.id))
                        }
                      >
                        {linkedCatalogId === match.id ? "Linked" : "Link"}
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Linking counts this room's stock under the same catalog listing, so people
                    ordering see one item and staff can pull from whichever room has stock.
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="h-12 text-base"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., pieces" 
                          className="h-12 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Details</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Shelf A3, Cabinet 2" 
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Item description"
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimum_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Quantity (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Alert when below this amount"
                        className="h-12 text-base"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes"
                        className="resize-none min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12"
                  disabled={isSubmitting || isUploadingPhoto}
                >
                  {isSubmitting ? "Adding..." : 
                   isUploadingPhoto ? "Uploading..." : "Add Item"}
                </Button>
              </div>
          </form>
        </Form>
    </ModalFrame>
  );
}