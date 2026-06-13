/**
 * HelpRequestPage - Simple help request flow
 * 
 * Flow:
 * 1. What do you need? (4 big buttons)
 * 2. Describe it OR structured setup form (for "setup" type)
 * 3. Success confirmation with auto-redirect
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoHome } from '@shared/hooks/useHomePath';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Armchair,
  Truck,
  Sofa,
  HelpCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useStaffTasks } from '@features/tasks/hooks/useStaffTasks';
import { SetupRequestForm, SetupRequestData } from '@features/supply/components/request/SetupRequestForm';
import type { TaskType } from '@features/tasks/types/staffTasks';

interface HelpOption {
  id: TaskType;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
}

const helpOptions: HelpOption[] = [
  {
    id: 'setup',
    label: 'Set up a room',
    description: 'Tables, chairs, desks brought in and arranged for an event',
    icon: Armchair,
    placeholder: 'e.g., Set up conference room 201 for a meeting with 12 people',
  },
  {
    id: 'delivery',
    label: 'Bring me something',
    description: 'Deliver items to a room',
    icon: Truck,
    placeholder: 'e.g., Deliver 2 chairs to Room 310 by Friday morning',
  },
  {
    id: 'move_item',
    label: 'Move something',
    description: 'Furniture, equipment, or boxes between rooms',
    icon: Sofa,
    placeholder: 'e.g., Move the desk from Room 101 to Room 205',
  },
  {
    id: 'general',
    label: 'Something else',
    description: 'Any other help from the court aides',
    icon: HelpCircle,
    placeholder: 'Describe what you need help with...',
  },
];

// Submitted request details for success screen
interface SubmittedRequest {
  title: string;
  roomDisplay?: string;
  dateNeeded?: Date;
  timeNeeded?: string;
  items?: string;
  setupType?: string;
  attendeeCount?: number | null;
}

export default function HelpRequestPage() {
  const navigate = useNavigate();
  const goHome = useGoHome();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { requestTask } = useStaffTasks();

  // Where this user normally tracks these requests. Admins manage staff-task
  // requests on /tasks; everyone else has My Activity in their navigation.
  const isAdminish = profile?.role === 'admin' || profile?.role === 'system_admin';
  const trackPath = isAdminish ? '/tasks' : '/my-activity?tab=requests';
  const trackLabel = isAdminish ? 'Tasks' : 'My Activity';

  // Deep link: /request/help?type=setup jumps straight into that flow
  const typeParam = searchParams.get('type');
  const initialOption = helpOptions.find(o => o.id === typeParam) ?? null;

  const [step, setStep] = useState<'select' | 'describe' | 'setup' | 'success'>(
    initialOption ? (initialOption.id === 'setup' ? 'setup' : 'describe') : 'select'
  );
  const [selectedType, setSelectedType] = useState<HelpOption | null>(initialOption);
  const [description, setDescription] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState<SubmittedRequest | null>(null);

  // No auto-redirect: let the user read the confirmation and choose
  // where to go (track the request, submit another, or go home).

  // Re-sync when the ?type param CHANGES while already mounted (e.g. a desktop
  // entry point navigating from /request/help to /request/help?type=setup).
  // Gated by a ref so it fires only on an actual change — otherwise the in-page
  // Back button (which leaves the URL param intact) would be re-forced forward.
  const lastHandledType = useRef(typeParam);
  useEffect(() => {
    if (typeParam && typeParam !== lastHandledType.current) {
      lastHandledType.current = typeParam;
      const opt = helpOptions.find(o => o.id === typeParam);
      if (opt) {
        setSelectedType(opt);
        setStep(opt.id === 'setup' ? 'setup' : 'describe');
      }
    }
  }, [typeParam]);

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

    try {
      await requestTask.mutateAsync({
        title: description.slice(0, 100),
        description: description,
        task_type: selectedType.id,
      });
      setSubmittedRequest({ title: description.slice(0, 100) });
      setStep('success');
    } catch {
      // Error toast is surfaced by the mutation's onError; keep the form open
      // with the user's input so they can retry.
    }
  };

  const handleSetupSubmit = async (data: SetupRequestData) => {
    const setupTypeLabel = data.setupType.charAt(0).toUpperCase() + data.setupType.slice(1);
    const itemsSummary = data.items
      .map(i => (i.quantity > 1 ? `${i.quantity} ${i.name}` : i.name))
      .join(', ');

    // Title reads like the actual ask: "Room 628 — Event setup: 6 Tables, 30 Chairs"
    const title = itemsSummary
      ? `${data.roomDisplay} — ${setupTypeLabel} setup: ${itemsSummary}`
      : `${data.roomDisplay} — ${setupTypeLabel} setup`;

    const descriptionParts = [
      `Room: ${data.roomDisplay}`,
      `Date: ${data.dateNeeded ? format(data.dateNeeded, 'EEEE, MMMM d, yyyy') : 'Not specified'}`,
      `Time: ${data.timeNeeded || 'Not specified'}`,
      `Occasion: ${setupTypeLabel}`,
    ];
    if (itemsSummary) descriptionParts.push(`Items needed: ${itemsSummary}`);
    if (data.attendeeCount) descriptionParts.push(`Attendees: ${data.attendeeCount}`);
    if (data.additionalNotes) descriptionParts.push(`\nArrangement: ${data.additionalNotes}`);

    // due_date puts the setup on the aides' schedule for that day/time
    let dueDate: string | undefined;
    if (data.dateNeeded) {
      const due = new Date(data.dateNeeded);
      if (data.timeNeeded) {
        const [h, m] = data.timeNeeded.split(':').map(Number);
        due.setHours(h || 0, m || 0, 0, 0);
      } else {
        due.setHours(9, 0, 0, 0);
      }
      dueDate = due.toISOString();
    }

    try {
      await requestTask.mutateAsync({
        title: title.slice(0, 100),
        description: descriptionParts.join('\n'),
        task_type: 'setup',
        to_room_id: data.roomId || undefined,
        due_date: dueDate,
      });
    } catch {
      // Error toast surfaced by the mutation's onError; stay on the form.
      return;
    }

    setSubmittedRequest({
      title,
      roomDisplay: data.roomDisplay,
      dateNeeded: data.dateNeeded,
      timeNeeded: data.timeNeeded,
      items: itemsSummary || undefined,
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
      goHome(); // Role-aware home (admin -> "/", standard -> "/dashboard", etc.)
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
            onClick={goHome}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Make a Request</h1>
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
              <p className="text-sm">
                <span className="text-muted-foreground">When:</span> {format(submittedRequest.dateNeeded, 'EEEE, MMMM d, yyyy')}
                {submittedRequest.timeNeeded ? ` by ${submittedRequest.timeNeeded}` : ''}
              </p>
            )}
            {submittedRequest.items && (
              <p className="text-sm"><span className="text-muted-foreground">Items:</span> {submittedRequest.items}</p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">Occasion:</span> {submittedRequest.setupType}
              {submittedRequest.attendeeCount ? ` for ${submittedRequest.attendeeCount} people` : ''}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your request has been sent to the court aides.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          The court aides have been notified. Track its status in {trackLabel} anytime.
        </p>

        <div className="pt-4 flex flex-col gap-2">
          <Button onClick={() => navigate(trackPath)}>
            Track in {trackLabel}
          </Button>
          <Button variant="outline" onClick={() => {
            setStep('select');
            setSelectedType(null);
            setDescription('');
            setSubmittedRequest(null);
          }}>
            Submit Another Request
          </Button>
          <Button variant="ghost" onClick={goHome}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
