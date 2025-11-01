import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Package, Building2, Gavel, Key, Lightbulb, Wrench } from "lucide-react";
import { getAllRoleDescriptions } from "@/utils/titleToRoleMapping";

/**
 * Access Level Guide Component
 * 
 * Displays a comprehensive guide showing how job titles map to access levels
 * Useful for admins and users to understand the automatic role assignment system
 */
export function AccessLevelGuide() {
  const roleDescriptions = getAllRoleDescriptions();

  const getIconForRole = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-5 w-5" />;
      case "facilities_manager":
        return <Building2 className="h-5 w-5" />;
      case "supply_room_staff":
        return <Package className="h-5 w-5" />;
      case "judge":
      case "clerk":
      case "court_aide":
        return <Gavel className="h-5 w-5" />;
      case "sergeant":
      case "court_officer":
      case "bailiff":
        return <Key className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "facilities_manager":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "supply_room_staff":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "judge":
      case "clerk":
      case "court_aide":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      case "sergeant":
      case "court_officer":
      case "bailiff":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Title-Based Access Control
        </CardTitle>
        <CardDescription>
          Job titles automatically determine user access levels and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {roleDescriptions.map((roleInfo) => (
            <Card key={roleInfo.role} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIconForRole(roleInfo.role)}
                    <CardTitle className="text-base">{roleInfo.description}</CardTitle>
                  </div>
                  <Badge variant="outline" className={getRoleColor(roleInfo.role)}>
                    {roleInfo.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Example Titles:</p>
                  <div className="flex flex-wrap gap-1">
                    {roleInfo.exampleTitles.map((title, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {title}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Access Level:</p>
                  <p className="text-sm">{roleInfo.accessDescription}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            How It Works
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Users enter their job title during signup or onboarding</li>
            <li>The system automatically matches keywords in the title to determine the appropriate role</li>
            <li>Permissions are assigned immediately based on the detected role</li>
            <li>Supply Department users automatically get inventory and supply request access</li>
            <li>Court personnel get access to court operations features</li>
            <li>Facilities managers get full building management capabilities</li>
            <li>Admins can manually adjust roles if needed</li>
          </ul>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
            <Wrench className="h-4 w-4" />
            Special Cases
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li><strong>Supply Department Override:</strong> Anyone in the Supply Department automatically gets supply_room_staff permissions, regardless of their title</li>
            <li><strong>Multiple Keywords:</strong> If a title contains multiple role keywords, the first match in the priority list is used</li>
            <li><strong>No Match:</strong> Users without a recognized title default to "Standard User" with basic access</li>
            <li><strong>Case Insensitive:</strong> Title matching is case-insensitive (e.g., "Supply Clerk" = "supply clerk")</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
