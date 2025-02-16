
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useProfileForm } from "./hooks/useProfileForm";
import { BasicInfoFields } from "./form-sections/BasicInfoFields";
import { WorkInfoFields } from "./form-sections/WorkInfoFields";
import { PreferencesFields } from "./form-sections/PreferencesFields";
import { EmergencyContactFields } from "./form-sections/EmergencyContactFields";

export function PersonalInfoForm() {
  const { form, isLoading, onSubmit } = useProfileForm();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BasicInfoFields form={form} />
        <WorkInfoFields form={form} />
        <PreferencesFields form={form} />
        <EmergencyContactFields form={form} />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
