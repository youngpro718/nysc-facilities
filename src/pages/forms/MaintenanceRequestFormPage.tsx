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
import { ArrowLeft, Wrench, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MaintenanceRequestFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    work_type: 'general',
    location: '',
    priority: 'medium',
    requestor_name: '',
    requestor_email: '',
    requestor_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user?.id) {
        // Authenticated user submission
        let roomId = null;
        if (formData.location) {
          const { data: room } = await supabase
            .from('court_rooms')
            .select('id')
            .eq('room_number', formData.location)
            .maybeSingle();
          
          if (room) roomId = room.id;
        }

        const { error: requestError } = await supabase
          .from('maintenance_requests')
          .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            status: 'pending',
            room_id: roomId,
            work_type: formData.work_type,
          });

        if (requestError) throw requestError;
      } else {
        // Anonymous user submission
        const { error } = await supabase
          .from('form_submissions')
          .insert({
            form_type: 'maintenance-request',
            processing_status: 'pending',
            extracted_data: {
              title: formData.title,
              description: formData.description,
              work_type: formData.work_type,
              location: formData.location,
              priority: formData.priority,
              requestor_name: formData.requestor_name,
              requestor_email: formData.requestor_email,
              requestor_phone: formData.requestor_phone,
              public_submission: true,
            },
          });
        
        if (error) throw error;
      }

      setSubmitted(true);
      toast.success('Maintenance request submitted successfully!', {
        description: 'Your request will be reviewed shortly.',
      });
    } catch (error: any) {
      console.error('Error submitting maintenance request:', error);
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
                Your maintenance request has been received and will be processed shortly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">What Happens Next?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>You'll receive an email confirmation at {formData.requestor_email}</li>
                  <li>Your request will be reviewed by the maintenance team</li>
                  <li>You'll receive updates via email as work is scheduled</li>
                  <li>The team will complete the work as soon as possible</li>
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
            onClick={() => window.location.href = '/public-forms'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
          <h1 className="text-3xl font-bold">NYSC Facilities Hub</h1>
          <p className="text-lg opacity-90 mt-1">Maintenance Request</p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Wrench className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Maintenance Request Form</CardTitle>
              <CardDescription>
                Report maintenance issues or request repairs
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
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the maintenance needed..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
              />
            </div>

            {/* Work Type */}
            <div className="space-y-2">
              <Label htmlFor="work_type">
                Work Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.work_type}
                onValueChange={(value) => setFormData({ ...formData, work_type: value })}
              >
                <SelectTrigger id="work_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="carpentry">Carpentry</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="general">General Repair</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Room/Location Number */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Room/Location Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., Room 1000, Hallway 3B"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  <SelectItem value="emergency">Emergency</SelectItem>
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
                <Label htmlFor="requestor_phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="requestor_phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.requestor_phone}
                  onChange={(e) => setFormData({ ...formData, requestor_phone: e.target.value })}
                  required
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
