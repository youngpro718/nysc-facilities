import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Camera,
  MapPin,
  AlertTriangle,
  Mic,
  FileText,
  Send
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  type: 'key_request' | 'issue_report';
}

export function MobileRequestForm({
  open,
  onClose,
  onSubmit,
  type
}: MobileRequestFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    building: '',
    room: '',
    priority: 'medium',
    category: '',
    keyType: '',
    reason: '',
    duration: '',
    photos: [] as File[]
  });

  const [isRecording, setIsRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const isKeyRequest = type === 'key_request';
  const totalSteps = isKeyRequest ? 3 : 4;

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      location: '',
      building: '',
      room: '',
      priority: 'medium',
      category: '',
      keyType: '',
      reason: '',
      duration: '',
      photos: []
    });
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  const renderKeyRequestForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyType">Key Type</Label>
              <Select 
                value={formData.keyType} 
                onValueChange={(value) => setFormData({...formData, keyType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select key type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master Key</SelectItem>
                  <SelectItem value="room">Room Key</SelectItem>
                  <SelectItem value="office">Office Key</SelectItem>
                  <SelectItem value="storage">Storage Key</SelectItem>
                  <SelectItem value="emergency">Emergency Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Explain why you need this key..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="building">Building</Label>
              <Select 
                value={formData.building} 
                onValueChange={(value) => setFormData({...formData, building: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Building</SelectItem>
                  <SelectItem value="north">North Wing</SelectItem>
                  <SelectItem value="south">South Wing</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="room">Room/Area</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                placeholder="e.g., Room 101, Storage A, etc."
              />
            </div>

            <div>
              <Label htmlFor="duration">Access Duration</Label>
              <Select 
                value={formData.duration} 
                onValueChange={(value) => setFormData({...formData, duration: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How long do you need access?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary (1-7 days)</SelectItem>
                  <SelectItem value="short_term">Short Term (1-4 weeks)</SelectItem>
                  <SelectItem value="long_term">Long Term (1-6 months)</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Review Your Request</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Please review your key request details before submitting.
              </p>
              
              <div className="space-y-3 text-left bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Key Type</p>
                  <p className="text-sm text-muted-foreground">{formData.keyType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{formData.building} - {formData.room}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{formData.duration}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-sm text-muted-foreground">{formData.reason}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderIssueReportForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Brief description of the issue..."
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How urgent is this issue?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Can wait</SelectItem>
                  <SelectItem value="medium">Medium - Normal priority</SelectItem>
                  <SelectItem value="high">High - Needs attention soon</SelectItem>
                  <SelectItem value="urgent">Urgent - Immediate attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Location Details</h3>
            </div>

            <div>
              <Label htmlFor="building">Building</Label>
              <Select 
                value={formData.building} 
                onValueChange={(value) => setFormData({...formData, building: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Building</SelectItem>
                  <SelectItem value="north">North Wing</SelectItem>
                  <SelectItem value="south">South Wing</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="room">Room/Area</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                placeholder="e.g., Room 101, Hallway B, Parking Lot, etc."
              />
            </div>

            <div>
              <Label htmlFor="location">Specific Location Details</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Near the elevator, By the window, etc."
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the issue in detail..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-3">
              <Label>Voice Note (Optional)</Label>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                className="w-full"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isRecording ? "Stop Recording" : "Record Voice Note"}
              </Button>
              {isRecording && (
                <p className="text-xs text-muted-foreground text-center">
                  Recording... Tap stop when finished
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Add Photos (Optional)</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Photos help us understand the issue better
                </p>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>

            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Ready to submit your issue report?
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] max-h-[90vh]">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {isKeyRequest ? 'Request Key Access' : 'Report an Issue'}
          </SheetTitle>
          <SheetDescription>
            {isKeyRequest 
              ? 'Fill out this form to request access to a key' 
              : 'Help us maintain the facility by reporting issues'
            }
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6">
            {renderProgressBar()}
            
            {isKeyRequest ? renderKeyRequestForm() : renderIssueReportForm()}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleBack}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button 
            className="flex-1"
            onClick={handleNext}
            disabled={
              isKeyRequest 
                ? (currentStep === 1 && (!formData.keyType || !formData.reason)) ||
                  (currentStep === 2 && (!formData.building || !formData.room))
                : (currentStep === 1 && (!formData.title || !formData.category)) ||
                  (currentStep === 2 && (!formData.building || !formData.room)) ||
                  (currentStep === 3 && !formData.description)
            }
          >
            {currentStep === totalSteps ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit {isKeyRequest ? 'Request' : 'Report'}
              </>
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}