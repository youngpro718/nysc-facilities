
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ContactSection } from "./details/ContactSection";
import { EmploymentSection } from "./details/EmploymentSection";
import { LocationSection } from "./details/LocationSection";
import { KeyAssignmentSection } from "./details/KeyAssignmentSection";
import { useKeyAssignments } from "./hooks/useKeyAssignments";
import { CollapsibleSection } from "./details/CollapsibleSection";
import { useIsMobile } from "@/hooks/use-mobile";

interface OccupantDetailsProps {
  occupant: {
    id: string;
    email: string | null;
    phone: string | null;
    department: string | null;
    title: string | null;
    status: string | null;
    rooms?: {
      name: string;
      room_number: string;
      floors?: {
        name: string;
        buildings?: {
          name: string;
        };
      };
    };
  };
}

export function OccupantDetails({ occupant }: OccupantDetailsProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { keyAssignments, isLoading, handleReturnKey } = useKeyAssignments(occupant.id);

  return (
    <div className="space-y-4">
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => navigate("/occupants")}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Occupants
        </Button>
      )}

      <div className="space-y-6 bg-muted/50 rounded-lg p-3 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <CollapsibleSection title="Contact Information">
            <ContactSection 
              email={occupant.email} 
              phone={occupant.phone} 
            />
          </CollapsibleSection>

          <CollapsibleSection title="Employment Details">
            <EmploymentSection 
              department={occupant.department}
              title={occupant.title}
              status={occupant.status}
            />
          </CollapsibleSection>
        </div>

        <Separator />

        <CollapsibleSection title="Location">
          <LocationSection 
            building={occupant.rooms?.floors?.buildings}
            roomNumber={occupant.rooms?.room_number}
          />
        </CollapsibleSection>

        <Separator />

        <CollapsibleSection title="Access Information" defaultOpen={true}>
          <KeyAssignmentSection 
            keyAssignments={keyAssignments}
            isLoading={isLoading}
            onReturnKey={handleReturnKey}
          />
        </CollapsibleSection>
      </div>
    </div>
  );
}
