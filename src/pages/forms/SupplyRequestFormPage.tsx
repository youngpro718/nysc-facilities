import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, Send, Plus, X, CheckCircle, AlertTriangle, Search, Package, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { isLowStock } from '@/constants/inventory';

interface SupplyItem {
  item_id?: string; // Link to inventory item if selected
  item_name: string;
  quantity: number;
  notes: string;
  available_stock?: number;
  unit?: string;
}

interface InventoryItemOption {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity?: number;
  unit?: string;
  category_name?: string;
}

export default function SupplyRequestFormPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasPermission } = useRolePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if user is supply room staff who FULFILLS orders (not creates them)
  // Only redirect users who have supply_orders admin permission (court_aide, purchasing_staff)
  // AND are in the Supply Department - these are the fulfillment staff
  const isSupplyFulfillmentStaff = hasPermission('supply_orders', 'admin') && 
                                   (profile as any)?.department === 'Supply Department';

  // Note: We do NOT redirect based on supply_requests permission
  // because ALL users should be able to CREATE supply requests
  // Only supply room fulfillment staff should be redirected to their dashboard
  useEffect(() => {
    if (isSupplyFulfillmentStaff) {
      toast.info('As supply staff, please use the Supply Room dashboard');
      navigate('/supply-room');
    }
  }, [isSupplyFulfillmentStaff, navigate]);

  // Fetch inventory items for autocomplete
  const { data: inventoryItems = [] } = useQuery<InventoryItemOption[]>({
    queryKey: ['inventory-items-for-request'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          quantity,
          minimum_quantity,
          unit,
          inventory_categories (name)
        `)
        .gt('quantity', 0) // Only show items in stock
        .order('name');
      
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        category_name: item.inventory_categories?.name
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const [openItemPicker, setOpenItemPicker] = useState<number | null>(null);
  
  // Auto-fill form with user profile data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    justification: '',
    priority: 'medium',
    department: '',
    requestor_name: '',
    requestor_email: '',
    delivery_method: 'pickup', // 'pickup' or 'mailbox'
    delivery_location: '', // Room number or mailbox location
  });

  // Auto-populate form fields from user profile when available
  useEffect(() => {
    if (user && profile) {
      const profileData = profile as any;
      setFormData(prev => ({
        ...prev,
        requestor_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || prev.requestor_name,
        requestor_email: user.email || prev.requestor_email,
        department: profileData.department || profileData.departments?.name || prev.department,
        // Pre-fill delivery location with user's room if available
        delivery_location: profileData.room_number || profileData.office_location || prev.delivery_location,
      }));
    }
  }, [user, profile]);

  const [items, setItems] = useState<SupplyItem[]>([
    { item_name: '', quantity: 1, notes: '' }
  ]);

  const addItem = () => {
    setItems([...items, { item_name: '', quantity: 1, notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof SupplyItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Select an inventory item from the picker
  const selectInventoryItem = (index: number, inventoryItem: InventoryItemOption) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      item_id: inventoryItem.id,
      item_name: inventoryItem.name,
      available_stock: inventoryItem.quantity,
      unit: inventoryItem.unit,
    };
    setItems(newItems);
    setOpenItemPicker(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user?.id) {
        // Authenticated user submission
        const { data: request, error: requestError } = await supabase
          .from('supply_requests')
          .insert({
            user_id: user.id,
            requester_id: user.id,
            title: formData.title,
            description: formData.description,
            justification: formData.justification,
            priority: formData.priority,
            status: 'submitted', // Use 'submitted' as initial status
            delivery_method: formData.delivery_method,
            delivery_location: formData.delivery_location || null,
            notes: formData.department ? `Department: ${formData.department}` : null,
          })
          .select()
          .single();

        if (requestError) throw requestError;

        // Create supply request items
        const itemsToInsert = items
          .filter(item => item.item_name.trim())
          .map(item => ({
            request_id: request.id,
            item_id: item.item_id || null, // Link to inventory item if selected
            item_name: item.item_name,
            quantity_requested: item.quantity,
            notes: item.notes || null,
          }));

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('supply_request_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        // Add to status history
        await supabase.from('supply_request_status_history').insert({
          request_id: request.id,
          status: 'submitted',
          changed_by: user.id,
          notes: `Delivery: ${formData.delivery_method}${formData.delivery_location ? ` to ${formData.delivery_location}` : ''}`,
        });
      } else {
        // Anonymous user submission
        const { error } = await supabase
          .from('form_submissions')
          .insert({
            form_type: 'supply-request',
            processing_status: 'pending',
            extracted_data: {
              title: formData.title,
              description: formData.description,
              justification: formData.justification,
              priority: formData.priority,
              department: formData.department,
              items: items.filter(item => item.item_name.trim()),
              requestor_name: formData.requestor_name,
              requestor_email: formData.requestor_email,
              public_submission: true,
            },
          });
        
        if (error) throw error;
      }

      setSubmitted(true);
      toast.success('Supply request submitted successfully!', {
        description: 'Your request is being reviewed.',
      });
    } catch (error: any) {
      console.error('Error submitting supply request:', error);
      toast.error('Failed to submit request', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success page
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold">NYSC Facilities Hub</h1>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Request Submitted Successfully!</CardTitle>
              <CardDescription>
                Your supply request has been received and will be processed shortly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">What Happens Next?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>You'll receive an email confirmation at {formData.requestor_email}</li>
                  <li>Your request will be reviewed by the supply team</li>
                  <li>You'll receive updates via email as items are processed</li>
                  <li>Supplies will be ready for pickup or delivery once approved</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = '/public-forms'}
                >
                  Submit Another Form
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-2 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Supply Request</h1>
          <p className="text-lg opacity-90 mt-1">Request office supplies and materials</p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <ClipboardList className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Supply Request Form</CardTitle>
              <CardDescription>
                Request office supplies, equipment, or materials
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Request Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief description of supplies needed"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Items List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>
                    Items List <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select from inventory or type a custom item name
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-3">
                        {/* Item picker with autocomplete */}
                        <Popover open={openItemPicker === index} onOpenChange={(open) => setOpenItemPicker(open ? index : null)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openItemPicker === index}
                              className="w-full justify-between font-normal"
                            >
                              {item.item_name || "Select or type item name..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search inventory items..." 
                                onValueChange={(value) => {
                                  // Allow typing custom item name
                                  if (value && !inventoryItems.find(i => i.name.toLowerCase() === value.toLowerCase())) {
                                    updateItem(index, 'item_name', value);
                                  }
                                }}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-2 text-sm">
                                    <p className="text-muted-foreground">No matching inventory items.</p>
                                    <p className="text-xs mt-1">Type to enter a custom item name.</p>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup heading="Available Inventory">
                                  {inventoryItems.map((invItem) => (
                                    <CommandItem
                                      key={invItem.id}
                                      value={invItem.name}
                                      onSelect={() => selectInventoryItem(index, invItem)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          item.item_id === invItem.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span>{invItem.name}</span>
                                          {invItem.category_name && (
                                            <Badge variant="outline" className="text-xs">
                                              {invItem.category_name}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {invItem.quantity} {invItem.unit || 'units'} available
                                          {isLowStock(invItem.quantity, invItem.minimum_quantity) && (
                                            <span className="text-destructive ml-2">• Low stock</span>
                                          )}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {/* Show stock info if inventory item selected */}
                        {item.item_id && item.available_stock !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {item.available_stock} {item.unit || 'units'} in stock
                            </span>
                            {item.quantity > item.available_stock && (
                              <Badge variant="destructive" className="text-xs">
                                Exceeds stock
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <div className="w-32">
                            <Input
                              type="number"
                              placeholder="Qty"
                              min="1"
                              max={item.available_stock || undefined}
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              required
                            />
                          </div>
                          <Input
                            placeholder="Notes (optional)"
                            value={item.notes}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <Label htmlFor="justification">
                Justification <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="justification"
                placeholder="Explain why these supplies are needed..."
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Priority Level */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - No rush</SelectItem>
                  <SelectItem value="medium">Medium - Within a week</SelectItem>
                  <SelectItem value="high">High - Within 2-3 days</SelectItem>
                  <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Preference */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="delivery_method">
                  How would you like to receive your supplies? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.delivery_method}
                  onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}
                >
                  <SelectTrigger id="delivery_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>I'll pick up from Supply Room</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mailbox">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Deliver to my mailbox/office</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.delivery_method === 'mailbox' && (
                <div className="space-y-2">
                  <Label htmlFor="delivery_location">
                    Delivery Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="delivery_location"
                    placeholder="Room number, mailbox number, or office location"
                    value={formData.delivery_location}
                    onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                    required={formData.delivery_method === 'mailbox'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Please provide your room number or mailbox location for delivery
                  </p>
                </div>
              )}

              {formData.delivery_method === 'pickup' && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    You'll receive a notification when your supplies are ready for pickup at the Supply Room.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Department - Only show for non-authenticated users */}
            {!user && (
              <div className="space-y-2">
                <Label htmlFor="department">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="department"
                  placeholder="Your department name"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Requestor Information - Auto-filled from profile */}
            {user ? (
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Your Information</h3>
                  <Badge variant="secondary">Auto-filled from profile</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-medium">{formData.requestor_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{formData.requestor_email || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Department</Label>
                    <p className="font-medium">{formData.department || 'Not set'}</p>
                  </div>
                  {formData.delivery_location && formData.delivery_method === 'mailbox' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Default Location</Label>
                      <p className="font-medium">{formData.delivery_location}</p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This information is from your profile. To update it, visit your <a href="/profile" className="text-primary underline">Profile Settings</a>.
                </p>
              </div>
            ) : (
              // For non-authenticated users, show editable fields
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Your Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="requestor_name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="requestor_name"
                    placeholder="Your full name"
                    value={formData.requestor_name}
                    onChange={(e) => setFormData({ ...formData, requestor_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestor_email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="requestor_email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.requestor_email}
                    onChange={(e) => setFormData({ ...formData, requestor_email: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
