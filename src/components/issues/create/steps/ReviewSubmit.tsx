
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../../types/IssueTypes";
import { Card } from "@/components/ui/card";

interface ReviewSubmitProps {
  form: UseFormReturn<FormData>;
}

export function ReviewSubmit({ form }: ReviewSubmitProps) {
  const values = form.getValues();
  const issueType = {
    CLIMATE_CONTROL: "Climate Control",
    LEAK: "Water Leak",
    ELECTRICAL_NEEDS: "Electrical",
    GENERAL_REQUESTS: "General Request"
  }[values.type];

  return (
    <div className="space-y-6">
      <Card className="p-8 space-y-6 bg-background/50 border-white/10">
        <div>
          <h3 className="text-xl font-semibold mb-4">Issue Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-1">Type</p>
              <p className="text-lg">{issueType}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Priority</p>
              <p className="text-lg capitalize">{values.priority}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h4 className="text-lg font-medium mb-2">Title</h4>
          <p className="text-lg">{values.title}</p>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h4 className="text-lg font-medium mb-2">Description</h4>
          <div 
            className="prose prose-invert max-w-none" 
            dangerouslySetInnerHTML={{ __html: values.description || "" }} 
          />
        </div>

        {values.photos?.length > 0 && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-lg font-medium mb-4">Attached Photos</h4>
            <div className="grid grid-cols-3 gap-4">
              {values.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Issue photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
