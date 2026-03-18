
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionFieldsProps } from "./types";

export function ConnectionsField({ form, floorId, roomId }: ConnectionFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Connected Spaces</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-sm text-muted-foreground">
          Space connections feature is currently disabled.
        </div>
      </CardContent>
    </Card>
  );
}
