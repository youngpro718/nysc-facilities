
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  fetchReportTemplates, 
  createReportTemplate 
} from "../reportService";
import type { ReportTemplate } from "../types";

export function useTemplateManagement() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  const loadTemplates = async () => {
    try {
      const data = await fetchReportTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error Loading Templates",
        description: "Could not load report templates.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await createReportTemplate({
        name: newTemplateName,
        description: newTemplateDesc,
        config: {},
        is_public: false
      });
      
      toast({
        title: "Template Created",
        description: "Report template has been created successfully.",
      });
      
      setNewTemplateName("");
      setNewTemplateDesc("");
      await loadTemplates();
    } catch (error) {
      console.error('Template creation error:', error);
      toast({
        title: "Template Creation Failed",
        description: "There was an error creating the template.",
        variant: "destructive",
      });
    }
  };

  return {
    templates,
    newTemplateName,
    newTemplateDesc,
    setNewTemplateName,
    setNewTemplateDesc,
    loadTemplates,
    handleCreateTemplate
  };
}
