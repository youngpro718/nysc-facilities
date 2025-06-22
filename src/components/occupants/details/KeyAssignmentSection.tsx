
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key } from "lucide-react";
import { OccupantQueryResponse } from "../types/occupantTypes";

export interface KeyAssignment {
  id: string;
  assigned_at: string;
  returned_at?: string;
  keys?: {
    name: string;
    is_passkey: boolean;
    key_door_locations?: Array<{
      door_location: string;
    }>;
  };
}

interface KeyAssignmentSectionProps {
  occupantData: OccupantQueryResponse;
}

export function KeyAssignmentSection({ occupantData }: KeyAssignmentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Key Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Key assignment details coming soon...</p>
      </CardContent>
    </Card>
  );
}
