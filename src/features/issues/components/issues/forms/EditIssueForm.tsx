import { useState } from "react";
import { Form } from "@/components/ui/form";
import { Issue } from "../types/IssueTypes";
import { BasicIssueFields } from "../form-sections/BasicIssueFields";
import { StatusAndPriorityFields } from "../form-sections/StatusAndPriorityFields";
import { ResolutionFields } from "../form-sections/ResolutionFields";
import { IssuePhotoForm } from "../wizard/IssuePhotoForm";
import { useEditIssueForm } from "../hooks/useEditIssueForm";
import { DateFields } from "../form-sections/DateFields";
import { FormButtons } from "@/components/ui/form-buttons";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditIssueFormProps {
  issue: Issue;
  onClose: () => void;
  onSave: () => void;
}

export function EditIssueForm({ issue, onClose, onSave }: EditIssueFormProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(issue.photos || []);
  const { form, isResolved, updateIssueMutation, onSubmit } = useEditIssueForm(issue, () => {
    onSave();
    onClose();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    form.handleSubmit((values) => onSubmit(values, selectedPhotos))(e);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <BasicIssueFields form={form} />
            <StatusAndPriorityFields form={form} />
            <DateFields form={form} />
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-6">
              <AnimatePresence>
                {isResolved && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ResolutionFields form={form} />
                  </motion.div>
                )}
              </AnimatePresence>

              <IssuePhotoForm
                selectedPhotos={selectedPhotos}
                onPhotosChange={setSelectedPhotos}
              />
            </div>
          </TabsContent>
        </Tabs>

        <FormButtons
          onCancel={onClose}
          isSubmitting={updateIssueMutation.isPending}
          submitLabel="Update Issue"
          sticky
        />
      </form>
    </Form>
  );
}
