import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type RoomFormData } from "./RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";
import { Camera } from "lucide-react";

interface CourtroomFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomFields({ form }: CourtroomFieldsProps) {
  const roomType = form.watch("roomType");
  
  if (roomType !== RoomTypeEnum.COURTROOM) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Courtroom Specifics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="courtroom_photos.judge_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Judge View Photo URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="URL to judge's view photo" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courtroom_photos.audience_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience View Photo URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="URL to audience view photo" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}