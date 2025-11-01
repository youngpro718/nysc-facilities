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
import { ArrowLeft, AlertCircle, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function IssueReportFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    issue_type: 'facility_problem',
    description: '',
    location: '',
    severity: 'medium',
    date_time: new Date().toISOString().slice(0, 16),
    reporter_name: '',
    reporter_email: '',
    reporter_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user?.id) {
        // Authenticated user submission
        const { error: issueError } = await supabase
          .from('issues')
          .insert({
            user_id: user.id,
            title: `${formData.issue_type.replace('_', ' ')} - ${formData.location}`,
            description: formData.description,
            issue_type: formData.issue_type,
            priority: formData.severity,
            status: 'open',
            location_description: formData.location,
            severity: formData.severity,
            reported_by: user.id,
            created_by: user.id,
          });

        if (issueError) throw issueError;
      } else {
        // Anonymous user submission
        const { error } = await supabase
          .from('form_submissions')
          .insert({
            form_type: 'issue-report',
            processing_status: 'pending',
            extracted_data: {
              issue_type: formData.issue_type,
              description: formData.description,
              location: formData.location,
              severity: formData.severity,
              date_time: formData.date_time,
              reporter_name: formData.reporter_name,
              reporter_email: formData.reporter_email,
              reporter_phone: formData.reporter_phone,
              public_submission: true,
            },
          });
        
        if (error) throw error;
      }

      setSubmitted(true);
      toast.success('Issue report submitted successfully!', {
        description: 'Your report will be reviewed by the facilities team.',
      });
    } catch (error: any) {
      console.error('Error submitting issue report:', error);
      toast.error('Failed to submit report', {
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
              <CardTitle className="text-2xl">Report Submitted Successfully!</CardTitle>
              <CardDescription>
                Your issue report has been received and will be reviewed shortly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">What Happens Next?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>You'll receive an email confirmation at {formData.reporter_email}</li>
                  <li>Your report will be reviewed by the facilities team</li>
                  <li>You'll receive updates via email as the issue is addressed</li>
                  <li>The team will work to resolve the issue promptly</li>
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
          <p className="text-lg opacity-90 mt-1">Issue Report</p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-500/10">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Issue Report Form</CardTitle>
              <CardDescription>
                Report general issues, concerns, or observations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Type */}
            <div className="space-y-2">
              <Label htmlFor="issue_type">
                Issue Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.issue_type}
                onValueChange={(value) => setFormData({ ...formData, issue_type: value })}
              >
                <SelectTrigger id="issue_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety_concern">Safety Concern</SelectItem>
                  <SelectItem value="security_issue">Security Issue</SelectItem>
                  <SelectItem value="facility_problem">Facility Problem</SelectItem>
                  <SelectItem value="equipment_malfunction">Equipment Malfunction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                required
              />
            </div>

            {/* Location Description */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="Where did you observe this issue?"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {/* Severity Level */}
            <div className="space-y-2">
              <Label htmlFor="severity">
                Severity Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger id="severity">
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

            {/* Date/Time Observed */}
            <div className="space-y-2">
              <Label htmlFor="date_time">
                Date/Time Observed <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date_time"
                type="datetime-local"
                value={formData.date_time}
                onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                required
              />
            </div>

            {/* Reporter Information */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-lg">Your Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="reporter_name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reporter_name"
                  placeholder="Your full name"
                  value={formData.reporter_name}
                  onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporter_email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reporter_email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.reporter_email}
                  onChange={(e) => setFormData({ ...formData, reporter_email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporter_phone">Phone (optional)</Label>
                <Input
                  id="reporter_phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.reporter_phone}
                  onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
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
                    Submit Report
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
