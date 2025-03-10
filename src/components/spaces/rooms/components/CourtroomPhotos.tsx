
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Image } from "lucide-react";

interface CourtroomPhotosProps {
  photos: {
    judge_view?: string | null;
    audience_view?: string | null;
  };
}

export function CourtroomPhotos({ photos }: CourtroomPhotosProps) {
  const [activeTab, setActiveTab] = useState<string>("judge");
  
  // Check if any photos are available
  const hasPhotos = photos?.judge_view || photos?.audience_view;
  
  if (!hasPhotos) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-md bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Image className="h-6 w-6" />
          <p className="text-xs">No courtroom photos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Courtroom Views
        </h4>
      </div>
      
      <Tabs defaultValue="judge" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="judge" disabled={!photos?.judge_view}>
            Judge View
          </TabsTrigger>
          <TabsTrigger value="audience" disabled={!photos?.audience_view}>
            Audience View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="judge" className="mt-2">
          {photos?.judge_view && (
            <div className="relative aspect-video overflow-hidden rounded-md border">
              <img
                src={photos.judge_view}
                alt="View from judge's perspective"
                className="object-cover w-full h-full"
                loading="lazy"
              />
              <Badge className="absolute top-2 right-2">Judge View</Badge>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="audience" className="mt-2">
          {photos?.audience_view && (
            <div className="relative aspect-video overflow-hidden rounded-md border">
              <img
                src={photos.audience_view}
                alt="View from audience perspective"
                className="object-cover w-full h-full"
                loading="lazy"
              />
              <Badge className="absolute top-2 right-2">Audience View</Badge>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
