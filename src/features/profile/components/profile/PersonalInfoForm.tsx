import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useProfileForm } from "./hooks/useProfileForm";
import { BasicInfoFields } from "./form-sections/BasicInfoFields";
import { WorkInfoFields } from "./form-sections/WorkInfoFields";
import { useToast } from "@shared/hooks/use-toast";

export function PersonalInfoForm() {
  const { form, isLoading, onSubmit } = useProfileForm();
  const { toast } = useToast();

  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const first = Object.values(errors).find((e) => e?.message)?.message;
    toast({
      title: "Please fix the highlighted fields",
      description: first || "Some fields need attention before saving.",
      variant: "destructive",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <BasicInfoFields form={form} />
        <WorkInfoFields form={form} />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto h-11 touch-manipulation"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
