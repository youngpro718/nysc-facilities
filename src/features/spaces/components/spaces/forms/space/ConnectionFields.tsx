
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface ConnectionFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function ConnectionFields({ form, floorId }: ConnectionFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Connected Rooms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-sm text-muted-foreground">
          Room connections feature is currently disabled.
        </div>
      </CardContent>
    </Card>
  );
}
