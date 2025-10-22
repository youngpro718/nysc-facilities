import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, Send, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SupplyItem {
  item_name: string;
  quantity: number;
  notes: string;
}

export default function SupplyRequestFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    justification: '',
    priority: 'medium',
    department: '',
    requestor_name: '',
    requestor_email: user?.email || '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create supply request
      const { data: request, error: requestError } = await supabase
        .from('supply_requests')
        .insert({
          user_id: user?.id,
          title: formData.title,
          description: formData.description,
          justification: formData.justification,
          priority: formData.priority,
          status: 'pending',
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
        status: 'pending',
        changed_by: user?.id,
      });

      toast.success('Supply request submitted successfully!', {
        description: 'Your request is being reviewed.',
      });

      // Navigate to My Supply Requests page
      navigate('/supply-requests');
    } catch (error: any) {
      console.error('Error submitting supply request:', error);
      toast.error('Failed to submit request', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/form-templates')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Templates
      </Button>

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
                <Label>
                  Items List <span className="text-destructive">*</span>
                </Label>
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
                        <Input
                          placeholder="Item name"
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                          required
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Quantity"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-32"
                            required
                          />
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department/Location */}
            <div className="space-y-2">
              <Label htmlFor="department">
                Department/Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="department"
                placeholder="Your department or office location"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>

            {/* Requestor Information */}
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

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/form-templates')}
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
  );
}
