
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssuePhotoFormProps {
  selectedPhotos: string[];
  uploading: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function IssuePhotoForm({ selectedPhotos, uploading, onPhotoUpload }: IssuePhotoFormProps) {
  return (
    <div className="space-y-6">
      <FormItem>
        <FormLabel className="text-base">Add Photos</FormLabel>
        <FormControl>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="w-full cursor-pointer">
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-white/10 bg-background/50 hover:bg-background/70 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-2 text-primary" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                      </>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
            </div>

            {selectedPhotos.length > 0 && (
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <div className="grid grid-cols-3 gap-4">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className={cn(
                          "absolute -top-2 -right-2 h-6 w-6",
                          "opacity-0 group-hover:opacity-100 transition-opacity"
                        )}
                        onClick={() => {
                          const newPhotos = [...selectedPhotos];
                          newPhotos.splice(index, 1);
                          // TODO: Add setSelectedPhotos from props
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
}
