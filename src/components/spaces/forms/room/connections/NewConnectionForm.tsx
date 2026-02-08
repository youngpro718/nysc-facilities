
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoomConnectionData, ConnectionDirections } from "../RoomFormSchema";
import { SpaceOption } from "./types";
import { Loader2 } from "lucide-react";

interface NewConnectionFormProps {
  floorId: string;
  roomId?: string;
  onSubmit: (connection: RoomConnectionData) => void;
  onCancel: () => void;
  spaces?: SpaceOption[];
  isLoading?: boolean;
}

export function NewConnectionForm({
  floorId,
  roomId,
  onSubmit,
  onCancel,
  spaces = [],
  isLoading = false
}: NewConnectionFormProps) {
  const [toSpaceId, setToSpaceId] = useState("");
  const [connectionType, setConnectionType] = useState("");
  const [direction, setDirection] = useState<string>("north"); // Default to north
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = () => {
    setSubmitting(true);
    
    // Make sure direction is valid
    const validDirection = ConnectionDirections.includes(direction as unknown) 
      ? direction 
      : "north";
      
    onSubmit({
      toSpaceId,
      connectionType,
      direction: validDirection as unknown
    });
    
    setSubmitting(false);
  };
  
  const isValid = toSpaceId && connectionType;

  return (
    <div className="border p-4 rounded-md space-y-4">
      <h4 className="font-medium text-sm">New Connection</h4>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Connected Space</label>
          <Select
            value={toSpaceId}
            onValueChange={setToSpaceId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select space" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.room_number
                    ? `${space.name} (${space.room_number})`
                    : `${space.name} (${space.type})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Connection Type</label>
          <Select
            value={connectionType}
            onValueChange={setConnectionType}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="door">Door</SelectItem>
              <SelectItem value="opening">Open Access</SelectItem>
              <SelectItem value="window">Window</SelectItem>
              <SelectItem value="restricted">Restricted Access</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Direction</label>
          <Select
            value={direction}
            onValueChange={setDirection}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="east">East</SelectItem>
              <SelectItem value="west">West</SelectItem>
              <SelectItem value="northeast">Northeast</SelectItem>
              <SelectItem value="northwest">Northwest</SelectItem>
              <SelectItem value="southeast">Southeast</SelectItem>
              <SelectItem value="southwest">Southwest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Connection"
          )}
        </Button>
      </div>
    </div>
  );
}
