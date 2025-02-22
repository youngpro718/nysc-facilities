
import { Form } from "@/components/ui/form";
import { Issue } from "../types/IssueTypes";
import { BasicIssueFields } from "../form-sections/BasicIssueFields";
import { StatusAndPriorityFields } from "../form-sections/StatusAndPriorityFields";
import { AssigneeField } from "../form-sections/AssigneeField";
import { ResolutionFields } from "../form-sections/ResolutionFields";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { IssuePhotoForm } from "../wizard/IssuePhotoForm";
import { useEditIssueForm } from "../hooks/useEditIssueForm";
import { DateFields } from "../form-sections/DateFields";
import { FormButtons } from "../form-sections/FormButtons";
import { AnimatePresence, motion } from "framer-motion";

interface EditIssueFormProps {
  issue: Issue;
  onClose: () => void;
  onSave: () => void;
}

export function EditIssueForm({ issue, onClose, onSave }: EditIssueFormProps) {
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();
  const { form, isResolved, updateIssueMutation, onSubmit } = useEditIssueForm(issue, () => {
    onSave();
    onClose();
  });

  const handlePhotoRemove = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    form.handleSubmit(onSubmit)(e);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BasicIssueFields form={form} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssigneeField form={form} />
            <StatusAndPriorityFields form={form} />
          </div>

          <DateFields form={form} />

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
            uploading={uploading}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
          />
        </motion.div>

        <FormButtons 
          onClose={onClose}
          updateIssueMutation={updateIssueMutation}
        />
      </form>
    </Form>
  );
}
