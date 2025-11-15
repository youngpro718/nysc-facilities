import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MobileInput, MobileFormField, MobileButton } from "@/components/ui/mobile-form";
import { Switch } from "@/components/ui/switch";
import { FormData } from "../types/formTypes";
import { StandardizedIssueType } from "../constants/issueTypes";
import { UserAssignment } from "@/types/dashboard";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Check, ArrowLeft, ArrowRight, User, Phone, Building } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// Import step components
import { TypeStep } from "./components/TypeStep";
import { EnhancedLocationStep } from "./EnhancedLocationStep";
import { DetailsStep } from "./components/DetailsStep";

export interface ReportIssueWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assignedRooms?: UserAssignment[];
}

export function ReportIssueWizard({ onSuccess, onCancel, assignedRooms }: ReportIssueWizardProps) {
  const [currentStep, setCurrentStep] = useState<'type' | 'location' | 'details' | 'contact'>('type');
  const [selectedIssueType, setSelectedIssueType] = useState<StandardizedIssueType | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
      description: '',
      building_id: '',
      floor_id: '',
      room_id: '',
      issue_type: undefined,
      problem_type: '',
      reporter_name: '',
      reporter_phone: '',
      reporter_department: '',
      reporting_for_another_room: false,
    }
  });

  // Auto-populate user information when component mounts
  useEffect(() => {
    if (profile && user) {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      form.setValue('reporter_name', fullName || user.email || '');
      form.setValue('reporter_phone', profile.phone || '');
      form.setValue('reporter_department', profile.title || '');
    }
  }, [profile, user, form]);

  // Auto-populate user's primary room if they have one and aren't reporting for another room
  useEffect(() => {
    const reportingForAnother = form.watch('reporting_for_another_room');
    if (!reportingForAnother && assignedRooms && assignedRooms.length > 0) {
      // Find the primary room assignment
      const primaryRoom = assignedRooms.find(room => room.assignment_type === 'primary') || assignedRooms[0];
      if (primaryRoom) {
        form.setValue('room_id', primaryRoom.room_id);
        form.setValue('building_id', primaryRoom.building_id || '');
        form.setValue('floor_id', primaryRoom.floor_id || '');
      }
    } else if (reportingForAnother) {
      // Clear room selection if reporting for another room
      form.setValue('room_id', '');
      form.setValue('building_id', '');
      form.setValue('floor_id', '');
    }
  }, [form.watch('reporting_for_another_room'), assignedRooms, form]);

  // Handle photo upload
  const handlePhotoUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const uploadedUrls: string[] = [];
    const errors: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Not an image file`);
          continue;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          errors.push(`${file.name}: File too large (max 5MB)`);
          continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `issue-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('issue-photos')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          errors.push(`${file.name}: Upload failed`);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('issue-photos')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }
      
      if (uploadedUrls.length > 0) {
        setSelectedPhotos(prev => [...prev, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} photo(s) uploaded successfully`);
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to upload ${errors.length} file(s)`, {
          description: errors.join(', ')
        });
      }
    } catch (error) {
      console.error('Error in handlePhotoUpload:', error);
      toast.error('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const createIssueMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      
      const { error } = await supabase
        .from('issues')
        .insert({
          title: data.title || `${data.issue_type} Issue - ${isEmergency ? 'HIGH' : (data.priority?.toUpperCase() || 'MEDIUM')} Priority`,
          description: data.description,
          issue_type: data.issue_type,
          priority: isEmergency ? 'high' : (data.priority || 'medium'),
          status: 'open',
          building_id: data.building_id || null,
          floor_id: data.floor_id || null,
          room_id: data.room_id || null,
          photos: selectedPhotos,
          seen: false,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
          date_info: data.date_info || null,
          created_by: user.id,
          // Add contact information to notes for tracking
          notes: `Contact: ${data.reporter_name || 'N/A'}${data.reporter_phone ? ` | Phone: ${data.reporter_phone}` : ''}${data.reporter_department ? ` | Dept: ${data.reporter_department}` : ''}${data.reporting_for_another_room ? ' | Reporting for another room' : ''}`
        });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Issue reported successfully");
      form.reset();
      setSelectedIssueType(null);
      setCurrentStep('type');
      setSelectedPhotos([]);
      setIsEmergency(false);
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating issue:', error);
      toast.error(error.message || "Failed to report issue");
    }
  });

  const validateCurrentStep = () => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 'type':
        if (!selectedIssueType) {
          toast.error("Please select an issue type");
          return false;
        }
        form.setValue('issue_type', selectedIssueType);
        return true;
      case 'location':
        if (!values.room_id) {
          toast.error("Please select a room");
          return false;
        }
        return true;
      case 'contact':
        if (!values.reporter_name?.trim()) {
          toast.error("Please provide your name");
          return false;
        }
        return true;
      case 'details':
        if (!values.description?.trim()) {
          toast.error("Please provide a description");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    if (currentStep === 'type') {
      setCurrentStep('location');
    } else if (currentStep === 'location') {
      setCurrentStep('contact');
    } else if (currentStep === 'contact') {
      setCurrentStep('details');
    } else {
      // Submit the form
      const values = form.getValues();
      createIssueMutation.mutate(values);
    }
  };

  const handleBack = () => {
    if (currentStep === 'location') {
      setCurrentStep('type');
    } else if (currentStep === 'contact') {
      setCurrentStep('location');
    } else if (currentStep === 'details') {
      setCurrentStep('contact');
    }
  };

  // Get current step info for progress
  const steps = [
    { key: 'type', label: 'Issue Type', description: 'Select category' },
    { key: 'location', label: 'Location', description: 'Where is it?' },
    { key: 'contact', label: 'Contact Info', description: 'Your details' },
    { key: 'details', label: 'Details', description: 'Describe the issue' }
  ];
  
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
          {/* Progress Header */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Report an Issue</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.description}
                </p>
              </div>
              {isEmergency && (
                <Badge variant="destructive" className="w-fit shrink-0">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Emergency
                </Badge>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progressPercentage} className="h-2" />
              <div className="hidden sm:flex justify-between text-xs">
                {steps.map((step, index) => (
                  <div 
                    key={step.key}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      index <= currentStepIndex 
                        ? "text-primary font-medium" 
                        : "text-muted-foreground"
                    )}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2",
                        index === currentStepIndex 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground"
                      )} />
                    )}
                    <span className="hidden md:inline">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Alert */}
          {isEmergency && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This issue has been marked as emergency. It will be prioritized for immediate attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <div className="min-h-[300px] sm:min-h-[400px] lg:min-h-[450px]">
            {currentStep === 'type' && (
              <Card className="border-0 shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      What type of issue are you reporting?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Select the category that best describes your issue
                    </p>
                  </div>
                  <TypeStep 
                    form={form} 
                    selectedIssueType={selectedIssueType}
                    setSelectedIssueType={setSelectedIssueType}
                  />
                </div>
              </Card>
            )}
            
            {currentStep === 'location' && (
              <Card className="border-0 shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      Where is the issue located?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Help us locate the problem so we can address it quickly
                    </p>
                  </div>
                  <EnhancedLocationStep 
                    form={form} 
                    assignedRooms={assignedRooms}
                  />
                </div>
              </Card>
            )}
            
            {currentStep === 'contact' && (
              <Card className="border-0 shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      Contact Information
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      We need your contact details to follow up on this issue
                    </p>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {/* Reporting for another room toggle */}
                    <FormField
                      control={form.control}
                      name="reporting_for_another_room"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
                              Reporting for another room?
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Check this if you're reporting an issue in a room you don't normally use
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Reporter Name */}
                    <FormField
                      control={form.control}
                      name="reporter_name"
                      render={({ field }) => (
                        <MobileFormField
                          label={
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Your Name *
                            </span>
                          }
                          required
                        >
                          <MobileInput
                            placeholder="Enter your full name"
                            autoComplete="name"
                            {...field}
                          />
                        </MobileFormField>
                      )}
                    />

                    {/* Phone Number */}
                    <FormField
                      control={form.control}
                      name="reporter_phone"
                      render={({ field }) => (
                        <MobileFormField
                          label={
                            <span className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone Number
                            </span>
                          }
                        >
                          <MobileInput
                            type="tel"
                            placeholder="Enter your phone number"
                            autoComplete="tel"
                            {...field}
                          />
                        </MobileFormField>
                      )}
                    />

                    {/* Department/Title */}
                    <FormField
                      control={form.control}
                      name="reporter_department"
                      render={({ field }) => (
                        <MobileFormField
                          label={
                            <span className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Department/Title
                            </span>
                          }
                        >
                          <MobileInput
                            placeholder="Enter your department or job title"
                            autoComplete="organization-title"
                            {...field}
                          />
                        </MobileFormField>
                      )}
                    />

                    {/* Auto-populated info notice */}
                    {profile && (
                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                        <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          Your information has been automatically filled from your profile. 
                          You can edit it if needed.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {currentStep === 'details' && (
              <Card className="border-0 shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      Provide additional details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      The more details you provide, the faster we can resolve the issue
                    </p>
                  </div>
                  <DetailsStep 
                    form={form} 
                    isEmergency={isEmergency}
                    setIsEmergency={setIsEmergency}
                    selectedPhotos={selectedPhotos}
                    setSelectedPhotos={setSelectedPhotos}
                    uploading={uploading}
                    handlePhotoUpload={handlePhotoUpload}
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-4 border-t bg-background/50 backdrop-blur-sm sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-0 sm:static sm:bg-transparent sm:backdrop-blur-none">
            <MobileButton
              type="button"
              variant="outline"
              onClick={currentStep === 'type' ? onCancel : handleBack}
              className="w-full sm:w-auto"
              disabled={createIssueMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 'type' ? 'Cancel' : 'Back'}
            </MobileButton>

            <MobileButton
              type="button"
              onClick={handleNext}
              disabled={createIssueMutation.isPending || (currentStep === 'type' && !selectedIssueType)}
              className="w-full sm:w-auto"
            >
              {currentStep === 'details' ? (
                createIssueMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Issue
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </MobileButton>
          </div>
        </form>
      </Form>
    </div>
  );
}