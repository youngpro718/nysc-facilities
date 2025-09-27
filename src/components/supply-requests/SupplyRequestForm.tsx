import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { submitSupplyOrder } from '@/services/supplyOrdersService';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Search, X } from 'lucide-react';

const supplyRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  justification: z.string().min(1, 'Justification is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  requested_delivery_date: z.string().optional(),
  delivery_location: z.string().optional(),
  items: z.array(z.object({
    item_id: z.string(),
    quantity_requested: z.number().min(1, 'Quantity must be at least 1'),
    notes: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

type SupplyRequestFormData = z.infer<typeof supplyRequestSchema>;

interface SupplyRequestFormProps {
  onSuccess?: () => void;
}

export function SupplyRequestForm({ onSuccess }: SupplyRequestFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventoryItems = [], isLoading: itemsLoading } = useInventoryItems();

  const form = useForm<SupplyRequestFormData>({
    resolver: zodResolver(supplyRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      justification: '',
      priority: 'medium',
      requested_delivery_date: '',
      delivery_location: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const submitMutation = useMutation({
    mutationFn: (payload: any) => submitSupplyOrder(payload),
    onSuccess: (result: any) => {
      const requiresApproval = !!result?.approval_required;
      toast({
        title: 'Request submitted',
        description: requiresApproval
          ? 'Your request was submitted and requires manager approval.'
          : 'Your request was submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to submit supply request',
        variant: 'destructive',
      });
    },
  });

  const filteredItems = (inventoryItems as any[]).filter(item => {
    // Only show Office Supplies and Furniture
    const allowedCategories = ['Office Supplies', 'Furniture'];
    const isAllowedCategory = allowedCategories.includes(item.inventory_categories?.name || '');
    
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || selectedCategory === "all" || 
      item.inventory_categories?.name === selectedCategory;
    
    return isAllowedCategory && matchesSearch && matchesCategory;
  });

  const categories = ['Office Supplies', 'Furniture']; // Only allow these two categories

  const addItem = (itemId: string) => {
    try {
      const existingIndex = fields.findIndex(field => field.item_id === itemId);
      if (existingIndex >= 0) {
        const currentQuantity = form.getValues(`items.${existingIndex}.quantity_requested`);
        form.setValue(`items.${existingIndex}.quantity_requested`, currentQuantity + 1);
      } else {
        append({
          item_id: itemId,
          quantity_requested: 1,
          notes: '',
        });
      }
      setIsItemDialogOpen(false);
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getItemName = (itemId: string) => {
    const item = (inventoryItems as any[]).find(i => i.id === itemId);
    return item?.name || 'Unknown Item';
  };

  const getItemUnit = (itemId: string) => {
    const item = (inventoryItems as any[]).find(i => i.id === itemId);
    return item?.unit || 'units';
  };

  const onSubmit = (data: SupplyRequestFormData) => {
    // Ensure all required fields are present
    const payload = {
      title: data.title,
      description: data.description || '',
      justification: data.justification,
      priority: data.priority,
      requested_delivery_date: data.requested_delivery_date || null,
      delivery_location: data.delivery_location || '',
      items: data.items.map(item => ({
        item_id: item.item_id,
        quantity_requested: item.quantity_requested,
        notes: item.notes || '',
      })),
    };
    submitMutation.mutate(payload);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          New Supply Request
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          You can only request Office Supplies and Furniture items through this form.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Office Supplies for Q2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details about your request..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please explain why these supplies are needed..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requested_delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Delivery Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Room 205, Main Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Requested Items</h3>
                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Select Supply Items</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {itemsLoading ? (
                          <div className="text-center py-8">Loading items...</div>
                        ) : filteredItems.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No items found
                          </div>
                        ) : (
                          filteredItems.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                              onClick={() => addItem(item.id)}
                            >
                              <div className="flex-1">
                                 <div className="flex items-center gap-2">
                                   <h4 className="font-medium">{item.name || 'Unknown Item'}</h4>
                                   {item.inventory_categories?.name && (
                                     <Badge 
                                       variant="outline" 
                                       className="text-xs"
                                     >
                                       {item.inventory_categories.name}
                                     </Badge>
                                   )}
                                 </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                                 <p className="text-sm text-muted-foreground">
                                   Available: {item.quantity || 0} {item.unit || 'units'}
                                 </p>
                              </div>
                              <Button size="sm" variant="outline">
                                Add
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Click "Add Item" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{getItemName(field.item_id)}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity_requested`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-20"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <span className="text-sm text-muted-foreground">
                          {getItemUnit(field.item_id)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Clear Form
              </Button>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}