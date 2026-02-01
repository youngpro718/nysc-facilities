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
import { ArrowLeft, Key, Send, CheckCircle } from 'lucide-react';
import { submitKeyRequest } from '@/services/keyRequestService';
import { supabase } from '@/lib/supabase';

export default function KeyRequestFormPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    request_type: 'new',
    room_number: '',
    reason: '',
    quantity: 1,
    urgency: 'medium',
    requestor_name: '',
    requestor_email: '',
    requestor_phone: '',
  });

  // Redirect logged-in users to dashboard
  if (!isLoading && isAuthenticated && user) {
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
              <CardTitle className="text-xl">You're already logged in!</CardTitle>
              <CardDescription>
                Please use your dashboard to submit key requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                As a registered user, you can submit requests directly from your dashboard 
                where your information is already on file.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

      // Submit key request (works for both authenticated and anonymous users)
      if (user?.id) {
        // Authenticated user submission
        await submitKeyRequest({
          reason: formData.reason,
          user_id: user.id,
          request_type: formData.request_type as 'new' | 'spare' | 'replacement',
          room_id: roomId || undefined,
          room_other: !roomId ? formData.room_number : null,
          quantity: formData.quantity,
          emergency_contact: formData.requestor_phone || null,
          email_notifications_enabled: true,
        });
      } else {
        // Anonymous user submission - store in form_submissions table
        const { error } = await supabase
          .from('form_submissions')
          .insert({
            form_type: 'key-request',
            processing_status: 'pending',
            extracted_data: {
              request_type: formData.request_type,
              room_number: formData.room_number,
              reason: formData.reason,
              quantity: formData.quantity,
              urgency: formData.urgency,
              requestor_name: formData.requestor_name,
              requestor_email: formData.requestor_email,
              requestor_phone: formData.requestor_phone,
              public_submission: true,
            },
          });
        
        if (error) throw error;
      }

      setSubmitted(true);
      toast.success('Request submitted successfully!', {
        description: 'You will receive updates via email.',
      });
    } catch (error: any) {
      console.error('Error submitting key request:', error);
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
        {/* Header */}
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
                Your key request has been received and will be processed shortly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">What Happens Next?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>You'll receive an email confirmation at {formData.requestor_email}</li>
                  <li>Your request will be reviewed by the facilities team</li>
                  <li>You'll receive updates via email as your request is processed</li>
                  <li>Keys will be ready for pickup once approved</li>
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
      {/* Standalone Header */}
      <div className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-2 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => window.location.href = '/public-forms'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
          <h1 className="text-3xl font-bold">NYSC Facilities Hub</h1>
          <p className="text-lg opacity-90 mt-1">Key & Elevator Pass Request</p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
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
                onClick={() => window.location.href = '/public-forms'}
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
