import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, AlertTriangle, CheckCircle, Clock, Building2 } from 'lucide-react';
import { getLightingFixtures } from '@/services/supabase/lightingService';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const integratedLightingIssueSchema = z.object({
  fixture_id: z.string().min(1, 'Please select a lighting fixture'),
  issue_type: z.enum(['blown_bulb', 'ballast_issue', 'flickering', 'dim_light', 'not_working', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().min(10, 'Please provide a detailed description'),
  location: z.string().min(1, 'Location is required'),
  bulb_type: z.string().optional(),
  notes: z.string().optional(),
});

type IntegratedLightingIssueFormData = z.infer<typeof integratedLightingIssueSchema>;

interface IntegratedLightingIssueCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
}

export const IntegratedLightingIssueCreator: React.FC<IntegratedLightingIssueCreatorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  buildingId,
  floorId,
  roomId,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IntegratedLightingIssueFormData>({
    resolver: zodResolver(integratedLightingIssueSchema),
    defaultValues: {
      issue_type: 'blown_bulb',
      priority: 'medium',
    },
  });

  // Fetch lighting fixtures with optional filtering
  const { data: fixtures = [], isLoading: fixturesLoading } = useQuery({
    queryKey: ['lighting-fixtures', buildingId, floorId, roomId],
    queryFn: async () => {
      const allFixtures = await getLightingFixtures();
      
      // Filter fixtures based on provided IDs
      return allFixtures.filter(fixture => {
        if (roomId && fixture.room_id !== roomId) return false;
        if (floorId && fixture.floor_id !== floorId) return false;
        if (buildingId && fixture.building_id !== buildingId) return false;
        return true;
      });
    },
    enabled: !!user,
  });

  const onSubmit = async (data: IntegratedLightingIssueFormData) => {
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
      // Create both lighting issue and main issue
      const result = await createLightingIssue({
        fixture_id: data.fixture_id,
        issue_type: data.issue_type,
        priority: data.priority,
        description: data.description,
        location: data.location,
        bulb_type: data.bulb_type,
        notes: data.notes,
        reported_by: user.id,
      });

      toast({
        title: 'Success',
        description: 'Lighting issue created and integrated with main issues system',
      });

      form.reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating integrated lighting issue:', error);
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
      case 'flickering':
        return <AlertTriangle className="h-4 w-4" />;
      case 'dim_light':
        return <Clock className="h-4 w-4" />;
      case 'not_working':
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
      case 'flickering':
        return 'The light is flickering intermittently';
      case 'dim_light':
        return 'The light is too dim or not providing adequate illumination';
      case 'not_working':
        return 'The light is completely non-functional';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Report Lighting Issue
            </div>
          </DialogTitle>
          <DialogDescription>
            Create a lighting issue that will be tracked in both the lighting system and main issues dashboard
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lighting Issue Details</CardTitle>
                <CardDescription>
                  This issue will be automatically linked to the lighting fixture and tracked in the main issues system
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lighting fixture" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fixturesLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading fixtures...
                            </SelectItem>
                          ) : fixtures.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No fixtures available in this location
                            </SelectItem>
                          ) : (
                            fixtures.map((fixture) => (
                              <SelectItem key={fixture.id} value={fixture.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3 w-3" />
                                  <span>{fixture.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {fixture.room_number} - {fixture.floor_name}
                                  </span>
                                </div>
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
                          <SelectItem value="flickering">
                            <div className="flex items-center gap-2">
                              {getIssueTypeIcon('flickering')}
                              <div>
                                <div>Flickering</div>
                                <div className="text-xs text-muted-foreground">
                                  {getIssueTypeDescription('flickering')}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="dim_light">
                            <div className="flex items-center gap-2">
                              {getIssueTypeIcon('dim_light')}
                              <div>
                                <div>Dim Light</div>
                                <div className="text-xs text-muted-foreground">
                                  {getIssueTypeDescription('dim_light')}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="not_working">
                            <div className="flex items-center gap-2">
                              {getIssueTypeIcon('not_working')}
                              <div>
                                <div>Not Working</div>
                                <div className="text-xs text-muted-foreground">
                                  {getIssueTypeDescription('not_working')}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the lighting issue in detail. Include any symptoms, when it started, and any safety concerns..." 
                          className="resize-none" 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide detailed information to help maintenance staff understand and resolve the issue
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
                          placeholder="Any additional context, access instructions, or special considerations..." 
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
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !user}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Lighting Issue'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
