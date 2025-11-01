
import { Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KeySelectionFormProps {
  availableKeys: any[] | undefined;
  selectedKey: string;
  onKeySelect: (value: string) => void;
  hasAvailableKeys: boolean;
  selectedOccupantsCount: number;
}

export function KeySelectionForm({
  availableKeys,
  selectedKey,
  onKeySelect,
  hasAvailableKeys,
  selectedOccupantsCount,
}: KeySelectionFormProps) {
  return (
    <div className="space-y-4 py-4">
      {!hasAvailableKeys && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No keys available with sufficient quantity
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Key</label>
        <Select
          value={selectedKey}
          onValueChange={onKeySelect}
          disabled={!hasAvailableKeys}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              hasAvailableKeys 
                ? "Select a key" 
                : "No available keys"
            } />
          </SelectTrigger>
          <SelectContent>
            {availableKeys?.map((key) => (
              <SelectItem 
                key={key.id} 
                value={key.id}
              >
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {key.name} ({key.type}) - {key.available_quantity} available
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">
        Selected occupants: {selectedOccupantsCount}
      </div>
    </div>
  );
}
