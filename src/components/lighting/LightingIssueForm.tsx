import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { fetchLightingFixtures } from '@/services/supabase/lightingService';
import { createLightingIssue } from '@/services/supabase/lightingIssuesIntegration';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LightingFixture } from '@/types/lighting';
import type { LightingIssueCreateData } from '@/services/supabase/lightingIssuesIntegration';

const lightingIssueSchema = z.object({
  fixture_id: z.string().min(1, 'Please select a lighting fixture'),
  location: z.string().min(1, 'Location is required'),
  bulb_type: z.string().min(1, 'Bulb type is required'),
  form_factor: z.string().optional(),
  issue_type: z.enum(['blown_bulb', 'ballast_issue', 'other']),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

type LightingIssueFormData = z.infer<typeof lightingIssueSchema>;

interface LightingIssueFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const LightingIssueForm: React.FC<LightingIssueFormProps> = ({
  onSuccess,
  onCancel,
  className,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LightingIssueFormData>({
    resolver: zodResolver(lightingIssueSchema),
    defaultValues: {
      issue_type: 'blown_bulb',
      priority: 'medium',
    },
  });

  // Fetch lighting fixtures
  const { data: fixtures = [], isLoading: fixturesLoading } = useQuery<LightingFixture[]>({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
    enabled: !!user,
  });

  const onSubmit = async (data: LightingIssueFormData) => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create a lighting issue',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: LightingIssueCreateData = {
        fixture_id: data.fixture_id,
        location: data.location,
        bulb_type: data.bulb_type,
        form_factor: data.form_factor || undefined,
        issue_type: data.issue_type,
        notes: data.notes || undefined,
        reported_by: user.id,
        priority: data.priority,
      };

      await createLightingIssue(payload);

      toast({
        title: 'Success',
        description: 'Lighting issue created successfully',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating lighting issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lighting issue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'blown_bulb':
        return <Lightbulb className="h-4 w-4" />;
      case 'ballast_issue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'other':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getIssueTypeDescription = (type: string) => {
    switch (type) {
      case 'blown_bulb':
        return 'The light bulb has burned out and needs replacement';
      case 'ballast_issue':
        return 'The ballast is malfunctioning and needs repair or replacement';
      case 'other':
        return 'Other lighting-related issues not covered above';
      default:
        return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <Card>
          <CardHeader>
            <CardTitle>Report Lighting Issue</CardTitle>
            <CardDescription>
              Report a lighting problem for tracking and resolution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="fixture_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lighting Fixture</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        disabled={fixturesLoading || fixtures.length === 0 || !user}
                        aria-invalid={!!form.formState.errors.fixture_id}
                      >
                        <SelectValue 
                          placeholder={fixturesLoading ? 'Loading fixtures...' : (fixtures.length === 0 ? 'No fixtures available' : 'Select a lighting fixture')} 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fixturesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading fixtures...
                        </SelectItem>
                      ) : fixtures.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No fixtures available
                        </SelectItem>
                      ) : (
                        fixtures.map((fixture) => (
                          <SelectItem key={fixture.id} value={fixture.id}>
                            {fixture.name} - {fixture.room_number}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the specific lighting fixture with the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Main lobby ceiling light, Room 201 desk lamp" 
                      aria-invalid={!!form.formState.errors.location}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear description of where the lighting issue is located
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bulb_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bulb Type</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., LED, Fluorescent, Incandescent, Halogen" 
                      aria-invalid={!!form.formState.errors.bulb_type}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Specify the type of bulb or lighting technology
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issue_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="blown_bulb">
                        <div className="flex items-center gap-2">
                          {getIssueTypeIcon('blown_bulb')}
                          <div>
                            <div>Blown Bulb</div>
                            <div className="text-xs text-muted-foreground">
                              {getIssueTypeDescription('blown_bulb')}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="ballast_issue">
                        <div className="flex items-center gap-2">
                          {getIssueTypeIcon('ballast_issue')}
                          <div>
                            <div>Ballast Issue</div>
                            <div className="text-xs text-muted-foreground">
                              {getIssueTypeDescription('ballast_issue')}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center gap-2">
                          {getIssueTypeIcon('other')}
                          <div>
                            <div>Other</div>
                            <div className="text-xs text-muted-foreground">
                              {getIssueTypeDescription('other')}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="form_factor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form Factor (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Standard, Tube, Globe, Spotlight" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Specify the shape or form factor of the bulb/fixture
                  </FormDescription>
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
                      <SelectTrigger aria-invalid={!!form.formState.errors.priority}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">
                        <Badge className={getPriorityColor('low')}>Low</Badge>
                      </SelectItem>
                      <SelectItem value="medium">
                        <Badge className={getPriorityColor('medium')}>Medium</Badge>
                      </SelectItem>
                      <SelectItem value="high">
                        <Badge className={getPriorityColor('high')}>High</Badge>
                      </SelectItem>
                      <SelectItem value="critical">
                        <Badge className={getPriorityColor('critical')}>Critical</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the urgency level for this lighting issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details about the issue, access instructions, or special considerations..." 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any additional context that might help with resolution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !user}>
                {isSubmitting ? 'Creating...' : 'Create Issue'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};
