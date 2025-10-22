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
import { ArrowLeft, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function IssueReportFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    issue_type: 'facility_problem',
    description: '',
    location: '',
    severity: 'medium',
    date_time: new Date().toISOString().slice(0, 16),
    reporter_name: '',
    reporter_email: user?.email || '',
    reporter_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create issue
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          user_id: user?.id,
          title: `${formData.issue_type.replace('_', ' ')} - ${formData.location}`,
          description: formData.description,
          issue_type: formData.issue_type,
          priority: formData.severity,
          status: 'open',
          location_description: formData.location,
          severity: formData.severity,
          reported_by: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (issueError) throw issueError;

      toast.success('Issue report submitted successfully!', {
        description: 'Your report will be reviewed by the facilities team.',
      });

      // Navigate to My Issues page
      navigate('/issues');
    } catch (error: any) {
      console.error('Error submitting issue report:', error);
      toast.error('Failed to submit report', {
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
                    Submit Report
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
