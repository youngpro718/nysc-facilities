
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

interface EditIssueFormProps {
  issue: Issue;
  onClose: () => void;
}

export function EditIssueForm({ issue, onClose }: EditIssueFormProps) {
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();
  const { form, isResolved, updateIssueMutation, onSubmit } = useEditIssueForm(issue, onClose);

  const handlePhotoRemove = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          <BasicIssueFields form={form} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssigneeField form={form} />
            <StatusAndPriorityFields form={form} />
          </div>

          <DateFields form={form} />

          {isResolved && <ResolutionFields form={form} />}

          <IssuePhotoForm
            selectedPhotos={selectedPhotos}
            uploading={uploading}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
          />
        </div>

        <FormButtons 
          onClose={onClose}
          updateIssueMutation={updateIssueMutation}
        />
      </form>
    </Form>
  );
}
