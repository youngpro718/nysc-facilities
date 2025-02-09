
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IssuePhotoGrid } from "../card/IssuePhotoGrid";

interface IssuePhotoFormProps {
  selectedPhotos: string[];
  uploading: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function IssuePhotoForm({ selectedPhotos, uploading, onPhotoUpload }: IssuePhotoFormProps) {
  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-4 px-4 pr-8">
        <FormItem>
          <FormLabel className="text-base">Photos</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={onPhotoUpload}
                disabled={uploading}
                className="h-12 text-base"
              />
              <IssuePhotoGrid photos={selectedPhotos} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>
    </ScrollArea>
  );
}
