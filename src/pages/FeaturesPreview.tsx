import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

  const handleFeatureClick = (feature: typeof features[0]) => {
    if (feature.status === "available") {
      // Navigate to actual feature
      if (feature.title === "Issue Reporting") {
        navigate("/issues");
      } else if (feature.title === "System Settings") {
        navigate("/settings");
      }
    } else if (feature.status === "preview") {
      // Show preview/demo
      // Could implement feature demos here
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
            <h1 className="text-3xl font-bold tracking-tight">Features Preview</h1>
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
                        feature.status === 'available' ? 'bg-green-100 text-green-600' :
                        feature.status === 'preview' ? 'bg-blue-100 text-blue-600' :
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
                    <div className="mt-3 text-xs text-green-600 font-medium">
                      ✓ Available now - Click to access
                    </div>
                  )}
                  {feature.status === 'preview' && (
                    <div className="mt-3 text-xs text-blue-600 font-medium">
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
      </div>
    </div>
  );
}