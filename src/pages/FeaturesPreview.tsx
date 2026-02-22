import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Building, 
  Users, 
  Wrench, 
  Package, 
  Key, 
  Lightbulb,
  AlertTriangle,
  BarChart3,
  Settings,
  FileText
} from "lucide-react";

const features = [
  {
    icon: Building,
    title: "Space Management",
    description: "View building layouts, room information, and occupancy tracking",
    status: "preview",
    badge: "Core Feature"
  },
  {
    icon: AlertTriangle,
    title: "Issue Reporting",
    description: "Report maintenance issues and track their resolution status",
    status: "available",
    badge: "Available Now"
  },
  {
    icon: Users,
    title: "Occupant Directory",
    description: "Browse staff directory and contact information",
    status: "preview",
    badge: "Limited Preview"
  },
  {
    icon: Wrench,
    title: "Maintenance Requests",
    description: "Submit and track facility maintenance requests",
    status: "locked",
    badge: "Requires Verification"
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "View and manage facility supplies and equipment",
    status: "locked",
    badge: "Admin Only"
  },
  {
    icon: Key,
    title: "Key Management",
    description: "Request access keys and track assignments",
    status: "locked",
    badge: "Requires Verification"
  },
  {
    icon: Lightbulb,
    title: "Energy Monitoring",
    description: "Track facility energy usage and efficiency metrics",
    status: "locked",
    badge: "Advanced Feature"
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "View reports and insights on facility operations",
    status: "locked",
    badge: "Admin Only"
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Access facility documents and procedures",
    status: "preview",
    badge: "Limited Access"
  },
  {
    icon: Settings,
    title: "System Settings",
    description: "Configure user preferences and notifications",
    status: "available",
    badge: "Available Now"
  }
];

export default function FeaturesPreview() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isPending = profile?.verification_status === 'pending';
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<typeof features[0] | null>(null);

  const openPreview = (feature: typeof features[0]) => {
    setSelected(feature);
    setOpen(true);
  };

  const handleFeatureClick = (feature: typeof features[0]) => {
    if (feature.status === "available") {
      // Pending users see in-page demo instead of navigating
      if (isPending) {
        openPreview(feature);
        return;
      }

      // Navigate to actual feature for verified users
      if (feature.title === "Issue Reporting") {
        navigate("/my-issues");
      } else if (feature.title === "System Settings") {
        navigate("/settings");
      }
    } else if (feature.status === "preview") {
      // Always show preview/demo in-page
      openPreview(feature);
    }
    // Locked features do nothing
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/verification-pending')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Features Preview</h1>
            <p className="text-muted-foreground">
              Explore what you'll have access to once your account is verified
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isClickable = feature.status === "available" || feature.status === "preview";
            
            return (
              <Card 
                key={index} 
                className={`relative transition-all duration-200 ${
                  isClickable 
                    ? 'hover:shadow-lg cursor-pointer hover:scale-[1.02]' 
                    : 'opacity-60'
                } ${feature.status === 'locked' ? 'border-dashed' : ''}`}
                onClick={() => handleFeatureClick(feature)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        feature.status === 'available' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        feature.status === 'preview' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    {feature.status === 'locked' && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {feature.status === 'preview' && (
                      <Eye className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <Badge 
                    variant={
                      feature.status === 'available' ? 'default' :
                      feature.status === 'preview' ? 'secondary' :
                      'outline'
                    }
                    className="w-fit text-xs"
                  >
                    {feature.badge}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                  
                  {feature.status === 'available' && (
                    <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Available now - Click to access
                    </div>
                  )}
                  {feature.status === 'preview' && (
                    <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      👁 Preview available - Limited functionality
                    </div>
                  )}
                  {feature.status === 'locked' && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      🔒 Requires account verification
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <h2 className="text-xl font-semibold">Ready for Full Access?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Once your account is verified by an administrator, you'll have access to submit requests, 
                manage your profile, and use all available features based on your role and permissions.
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Available Now: 2 features
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Preview: 3 features
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Locked: 5 features
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selected?.title} Preview</DialogTitle>
              <DialogDescription>
                {selected?.status === 'available' ? 'Read-only demo while your account is pending verification.' : 'This is a limited preview of the feature.'}
              </DialogDescription>
            </DialogHeader>

            {selected?.title === 'Issue Reporting' && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue-title">Issue Title</Label>
                  <Input id="issue-title" placeholder="Leaky faucet in Room 204" disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issue-desc">Description</Label>
                  <Textarea id="issue-desc" placeholder="Describe the problem..." rows={4} disabled />
                </div>
                <div className="grid gap-2">
                  <Label>Recent Issues (sample)</Label>
                  <div className="rounded-md border bg-background">
                    <div className="p-3 border-b text-sm flex items-center justify-between">
                      <span>Light flickering - Courtroom 3</span>
                      <Badge variant="outline">Open</Badge>
                    </div>
                    <div className="p-3 border-b text-sm flex items-center justify-between">
                      <span>HVAC not cooling - Floor 5</span>
                      <Badge variant="outline">In Progress</Badge>
                    </div>
                    <div className="p-3 text-sm flex items-center justify-between">
                      <span>Door handle loose - Room 118</span>
                      <Badge variant="outline">Resolved</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">This is a demo. Submission is disabled until verification.</div>
              </div>
            )}

            {selected?.title === 'System Settings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive updates about requests and issues</div>
                  </div>
                  <Switch disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Dark Mode</div>
                    <div className="text-sm text-muted-foreground">Personalize your theme</div>
                  </div>
                  <Switch disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Enhance your account security</div>
                  </div>
                  <Switch disabled />
                </div>
                <div className="text-xs text-muted-foreground">This is a demo. Changes are disabled until verification.</div>
              </div>
            )}

            {selected && selected.title !== 'Issue Reporting' && selected.title !== 'System Settings' && (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{selected.description}</p>
                <p>Interactive preview coming soon.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}