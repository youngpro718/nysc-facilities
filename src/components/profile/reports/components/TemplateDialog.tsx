
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportTemplate } from "../types";

interface TemplateDialogProps {
  templates: ReportTemplate[];
  newTemplateName: string;
  newTemplateDesc: string;
  onTemplateNameChange: (value: string) => void;
  onTemplateDescChange: (value: string) => void;
  onCreateTemplate: () => void;
}

export function TemplateDialog({
  templates,
  newTemplateName,
  newTemplateDesc,
  onTemplateNameChange,
  onTemplateDescChange,
  onCreateTemplate
}: TemplateDialogProps) {
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Report Templates</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input
            value={newTemplateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            placeholder="Enter template name"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={newTemplateDesc}
            onChange={(e) => onTemplateDescChange(e.target.value)}
            placeholder="Enter template description"
          />
        </div>
        <Button onClick={onCreateTemplate}>Create Template</Button>
      </div>
      <ScrollArea className="h-[300px] mt-4">
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div>
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Use Template
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
