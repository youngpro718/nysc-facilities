
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../../types/IssueTypes";
import { Card } from "@/components/ui/card";

interface ReviewSubmitProps {
  form: UseFormReturn<FormData>;
}

export function ReviewSubmit({ form }: ReviewSubmitProps) {
  const values = form.getValues();

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Issue Details</h3>
          <div className="mt-2 space-y-2">
            <p><span className="text-muted-foreground">Title:</span> {values.title}</p>
            <p><span className="text-muted-foreground">Type:</span> {values.type}</p>
            <p><span className="text-muted-foreground">Priority:</span> {values.priority}</p>
            <div>
              <span className="text-muted-foreground">Description:</span>
              <div className="mt-1 prose prose-invert" dangerouslySetInnerHTML={{ __html: values.description || "" }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
