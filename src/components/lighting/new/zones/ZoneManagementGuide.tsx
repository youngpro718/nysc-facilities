import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Lightbulb, 
  Users, 
  Clock,
  ArrowRight,
  Plus,
  Settings,
  Zap
} from "lucide-react";

export function ZoneManagementGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            What are Lighting Zones?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Lighting zones are logical groupings of fixtures that can be controlled and managed together. 
            They help organize lighting systems for more efficient maintenance, scheduling, and control.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Zone Benefits
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Bulk control multiple fixtures simultaneously</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Schedule maintenance for entire areas</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Monitor energy usage by zone</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Organize work orders by area</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Common Zone Types
              </h4>
              <div className="space-y-2">
                <Badge variant="outline" className="mr-2">By Floor (Floor 1, Floor 2)</Badge>
                <Badge variant="outline" className="mr-2">By Function (Emergency, General)</Badge>
                <Badge variant="outline" className="mr-2">By Department (Admin, Courtrooms)</Badge>
                <Badge variant="outline" className="mr-2">By Circuit (Circuit A, Circuit B)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            How to Use Zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Create a Zone</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Create Zone" to define a new logical grouping. Give it a meaningful name 
                  like "Building A - Floor 1" or "Emergency Lighting Circuit".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Assign Fixtures</h4>
                <p className="text-sm text-muted-foreground">
                  Select multiple fixtures and use "Bulk Actions → Assign to Zone" to add them 
                  to your newly created zone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Manage as Group</h4>
                <p className="text-sm text-muted-foreground">
                  Now you can schedule maintenance, update status, or generate reports 
                  for all fixtures in the zone simultaneously.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="h-4 w-4" />
                  <span className="font-semibold">Create Emergency Zone</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Group all emergency lighting fixtures together
                </p>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Schedule Zone Maintenance</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Plan maintenance for entire zones at once
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}