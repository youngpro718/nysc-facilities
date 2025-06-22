
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, User } from "lucide-react";
import { OccupantQueryResponse } from "../types/occupantTypes";

interface ContactSectionProps {
  occupantData: OccupantQueryResponse;
}

export function ContactSection({ occupantData }: ContactSectionProps) {
  const emergencyContact = typeof occupantData.emergency_contact === 'string' 
    ? JSON.parse(occupantData.emergency_contact || '{}')
    : occupantData.emergency_contact || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{occupantData.email}</span>
        </div>
        {occupantData.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{occupantData.phone}</span>
          </div>
        )}
        {emergencyContact.name && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium">Emergency Contact</p>
            <p className="text-sm text-muted-foreground">{emergencyContact.name}</p>
            {emergencyContact.phone && (
              <p className="text-sm text-muted-foreground">{emergencyContact.phone}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
