
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Images, Info } from "lucide-react";

interface CourtroomPhotosProps {
  photos: {
    judge_view: string | null;
    audience_view: string | null;
  } | null;
}

export function CourtroomPhotos({ photos }: CourtroomPhotosProps) {
  const [openDialog, setOpenDialog] = useState(false);
  
  if (!photos || (!photos.judge_view && !photos.audience_view)) {
    return null;
  }

  const hasJudgeView = !!photos.judge_view;
  const hasAudienceView = !!photos.audience_view;
  
  return (
    <div className="mt-4">
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 w-full"
          >
            <Images className="h-4 w-4 mr-1" />
            View Courtroom Photos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <CardTitle className="text-xl mb-4">Courtroom Photos</CardTitle>
          <Tabs defaultValue={hasJudgeView ? "judge" : "audience"} className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger 
                value="judge" 
                className="flex-1"
                disabled={!hasJudgeView}
              >
                Judge View
              </TabsTrigger>
              <TabsTrigger 
                value="audience" 
                className="flex-1"
                disabled={!hasAudienceView}
              >
                Audience View
              </TabsTrigger>
            </TabsList>
            
            {hasJudgeView && (
              <TabsContent value="judge" className="mt-0">
                <div className="overflow-hidden rounded-md border">
                  <img 
                    src={photos.judge_view as string} 
                    alt="Judge View" 
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                </div>
              </TabsContent>
            )}
            
            {hasAudienceView && (
              <TabsContent value="audience" className="mt-0">
                <div className="overflow-hidden rounded-md border">
                  <img 
                    src={photos.audience_view as string} 
                    alt="Audience View" 
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
