
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Issues() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issues Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Issues management has been integrated into the main Lighting Management system.
            Please use the Lighting page for comprehensive issue tracking and management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
