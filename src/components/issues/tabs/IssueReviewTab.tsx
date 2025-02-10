
import { Card } from "@/components/ui/card";
import { FormData } from "../types/IssueTypes";

interface IssueReviewTabProps {
  formData: FormData;
  photos: string[];
}

export function IssueReviewTab({ formData, photos }: IssueReviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Issue Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Type:</span> {formData.type}</p>
              <p><span className="font-medium">Priority:</span> {formData.priority}</p>
              <p><span className="font-medium">Title:</span> {formData.title}</p>
              <p><span className="font-medium">Description:</span> {formData.description}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Location</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Building:</span> {formData.building_id}</p>
              <p><span className="font-medium">Floor:</span> {formData.floor_id}</p>
              <p><span className="font-medium">Room:</span> {formData.room_id}</p>
            </div>
          </div>

          {formData.temperature && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Additional Details</h3>
              <p><span className="font-medium">Temperature:</span> {formData.temperature}°F</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Photos</h3>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Issue photo ${index + 1}`}
                className="rounded-lg object-cover w-full aspect-video"
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
