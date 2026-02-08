/**
 * HelpRequestPage - Simple help request flow
 * 
 * Flow:
 * 1. What do you need? (4 big buttons)
 * 2. Describe it OR structured setup form (for "setup" type)
 * 3. Success confirmation with auto-redirect
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Sofa, 
  Truck, 
  LayoutGrid, 
  HelpCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import { SetupRequestForm, SetupRequestData } from '@/components/request/SetupRequestForm';
import type { TaskType } from '@/types/staffTasks';

interface HelpOption {
  id: TaskType;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
}

const helpOptions: HelpOption[] = [
  {
    id: 'move_item',
    label: 'Move something',
    description: 'Furniture, equipment, boxes',
    icon: Sofa,
    placeholder: 'e.g., Move the desk from Room 101 to Room 205',
  },
  {
    id: 'delivery',
    label: 'Deliver something',
    description: 'Bring items to a location',
    icon: Truck,
    placeholder: 'e.g., Deliver 2 chairs to Room 310',
  },
  {
    id: 'setup',
    label: 'Set up a room',
    description: 'Arrange furniture, equipment',
    icon: LayoutGrid,
    placeholder: 'e.g., Set up conference room 201 for a meeting with 12 people',
  },
  {
    id: 'general',
    label: 'Something else',
    description: 'Other help needed',
    icon: HelpCircle,
    placeholder: 'Describe what you need help with...',
  },
];

// Submitted request details for success screen
interface SubmittedRequest {
  title: string;
  roomDisplay?: string;
  dateNeeded?: Date;
  setupType?: string;
  attendeeCount?: number;
}

export default function HelpRequestPage() {
  const navigate = useNavigate();
  const { requestTask } = useStaffTasks();
  
  const [step, setStep] = useState<'select' | 'describe' | 'setup' | 'success'>('select');
  const [selectedType, setSelectedType] = useState<HelpOption | null>(null);
  const [description, setDescription] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState<SubmittedRequest | null>(null);

  // Auto-redirect to My Activity after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        navigate('/my-activity?tab=tasks');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const handleTypeSelect = (option: HelpOption) => {
    setSelectedType(option);
    // Use structured form for setup requests
    if (option.id === 'setup') {
      setStep('setup');
    } else {
      setStep('describe');
    }
  };

  const handleDescriptionSubmit = async () => {
    if (!selectedType || !description.trim()) return;

    await requestTask.mutateAsync({
      title: description.slice(0, 100),
      description: description,
      task_type: selectedType.id,
    });

    setSubmittedRequest({ title: description.slice(0, 100) });
    setStep('success');
  };

  const handleSetupSubmit = async (data: SetupRequestData) => {
    const setupTypeLabel = data.setupType.charAt(0).toUpperCase() + data.setupType.slice(1);
    const title = `${data.roomDisplay} - ${setupTypeLabel} for ${data.attendeeCount} people`;
    
    const descriptionParts = [
      `Room: ${data.roomDisplay}`,
      `Date: ${data.dateNeeded ? format(data.dateNeeded, 'EEEE, MMMM d, yyyy') : 'Not specified'}`,
      `Setup type: ${setupTypeLabel}`,
      `Attendees: ${data.attendeeCount}`,
    ];
    
    if (data.additionalNotes) {
      descriptionParts.push(`\nNotes: ${data.additionalNotes}`);
    }

    await requestTask.mutateAsync({
      title: title.slice(0, 100),
      description: descriptionParts.join('\n'),
      task_type: 'setup',
      to_room_id: data.roomId || undefined,
    });

    setSubmittedRequest({
      title,
      roomDisplay: data.roomDisplay,
      dateNeeded: data.dateNeeded,
      setupType: setupTypeLabel,
      attendeeCount: data.attendeeCount,
    });
    setStep('success');
  };

  const handleBack = () => {
    if (step === 'describe' || step === 'setup') {
      setStep('select');
      setDescription('');
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  // Step 1: Select type
  if (step === 'select') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Request Help</h1>
            <p className="text-muted-foreground text-sm">What do you need?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {helpOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleTypeSelect(option)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left w-full"
              >
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2a: Setup structured form
  if (step === 'setup') {
    return (
      <SetupRequestForm
        onSubmit={handleSetupSubmit}
        onBack={handleBack}
        isSubmitting={requestTask.isPending}
      />
    );
  }

  // Step 2b: Describe (for non-setup requests)
  if (step === 'describe' && selectedType) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedType.label}</h1>
            <p className="text-muted-foreground text-sm">Describe what you need</p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={selectedType.placeholder}
            rows={5}
            className="text-base"
            autoFocus
          />

          <p className="text-xs text-muted-foreground">
            Include room numbers, item details, and any timing preferences.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleDescriptionSubmit}
              disabled={!description.trim() || requestTask.isPending}
              className="flex-1"
            >
              {requestTask.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">Request Submitted!</h1>
        
        {/* Show structured summary for setup requests */}
        {submittedRequest?.roomDisplay ? (
          <div className="bg-muted/50 rounded-lg p-4 text-left max-w-sm mx-auto space-y-2">
            <p className="text-sm"><span className="text-muted-foreground">Room:</span> {submittedRequest.roomDisplay}</p>
            {submittedRequest.dateNeeded && (
              <p className="text-sm"><span className="text-muted-foreground">Date:</span> {format(submittedRequest.dateNeeded, 'EEEE, MMMM d, yyyy')}</p>
            )}
            <p className="text-sm"><span className="text-muted-foreground">Setup:</span> {submittedRequest.setupType} for {submittedRequest.attendeeCount} people</p>
          </div>
        ) : (
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your request has been sent to the facilities team.
          </p>
        )}
        
        <p className="text-sm text-muted-foreground">
          Redirecting to My Activity in 3 seconds...
        </p>
        
        <div className="pt-4 flex flex-col gap-2">
          <Button onClick={() => navigate('/my-activity?tab=tasks')}>
            View My Requests
          </Button>
          <Button variant="ghost" onClick={() => {
            setStep('select');
            setSelectedType(null);
            setDescription('');
            setSubmittedRequest(null);
          }}>
            Submit Another Request
          </Button>
        </div>
      </div>
    </div>
  );
}
