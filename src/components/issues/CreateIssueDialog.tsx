
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { IssueWizard } from "./create/IssueWizard";
import { CreateIssueForm } from "./create/CreateIssueForm";
import type { FormData } from "./types/IssueTypes";

interface CreateIssueDialogProps {
  onIssueCreated: () => void;
}

export function CreateIssueDialog({ onIssueCreated }: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('issues')
        .insert(data);

      if (error) throw error;

      onIssueCreated();
      setOpen(false);
    } catch (error) {
      console.error('Submit error:', error);
      throw error;
    }
  };

  if (isMobile) {
    return <IssueWizard onSubmit={handleSubmit} />;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
        </DialogHeader>
        <CreateIssueForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
