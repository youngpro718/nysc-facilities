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
import { ArrowLeft, Key, Send } from 'lucide-react';
import { submitKeyRequest } from '@/services/supabase/keyRequestService';
import { supabase } from '@/lib/supabase';

export default function KeyRequestFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    request_type: 'new',
    room_number: '',
    reason: '',
    quantity: 1,
    urgency: 'medium',
    requestor_name: '',
    requestor_email: user?.email || '',
    requestor_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Find room ID if room number provided
      let roomId = null;
      if (formData.room_number) {
        const { data: room } = await supabase
          .from('court_rooms')
          .select('id, room_id')
          .eq('room_number', formData.room_number)
          .maybeSingle();
        
        if (room) {
          roomId = room.room_id;
        }
      }

      // Submit key request
      await submitKeyRequest({
        reason: formData.reason,
        user_id: user?.id || '',
        request_type: formData.request_type as 'new' | 'spare' | 'replacement',
        room_id: roomId || undefined,
        room_other: !roomId ? formData.room_number : null,
        quantity: formData.quantity,
        emergency_contact: formData.requestor_phone || null,
        email_notifications_enabled: true,
      });

      toast.success('Key request submitted successfully!', {
        description: 'You will receive updates via email.',
      });

      // Navigate to My Requests page
      navigate('/my-requests');
    } catch (error: any) {
      console.error('Error submitting key request:', error);
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
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Key className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Key Request Form</CardTitle>
              <CardDescription>
                Request new keys, spare keys, or key replacements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div className="space-y-2">
              <Label htmlFor="request_type">
                Request Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.request_type}
                onValueChange={(value) => setFormData({ ...formData, request_type: value })}
              >
                <SelectTrigger id="request_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Key</SelectItem>
                  <SelectItem value="spare">Spare Key</SelectItem>
                  <SelectItem value="replacement">Replacement Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Room Number */}
            <div className="space-y-2">
              <Label htmlFor="room_number">
                Room Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="room_number"
                placeholder="e.g., 1000, 1324A"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Request <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why you need this key..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.quantity.toString()}
                onValueChange={(value) => setFormData({ ...formData, quantity: parseInt(value) })}
              >
                <SelectTrigger id="quantity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <Label htmlFor="urgency">
                Urgency Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value })}
              >
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
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

              <div className="space-y-2">
                <Label htmlFor="requestor_phone">Phone</Label>
                <Input
                  id="requestor_phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.requestor_phone}
                  onChange={(e) => setFormData({ ...formData, requestor_phone: e.target.value })}
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
