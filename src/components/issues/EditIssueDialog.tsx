import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Issue, IssueType } from "./types/IssueTypes";

type FormData = Omit<Issue, 'id'>;

export function EditIssueDialog({ issue, onIssueUpdated }: { issue: Issue; onIssueUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm<FormData>({
    defaultValues: {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      assigned_to: issue.assigned_to,
      type: issue.type,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update(data)
        .eq('id', issue.id);

      if (error) throw error;

      toast.success("Issue updated successfully");
      onIssueUpdated();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update issue");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] w-[95vw] p-4 sm:p-6">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle className="text-lg sm:text-xl">Edit Issue</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Title</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 sm:h-12 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[100px] text-base leading-relaxed resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-12">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="HVAC" className="py-3">HVAC</SelectItem>
                          <SelectItem value="Leak" className="py-3">Leak</SelectItem>
                          <SelectItem value="Electrical" className="py-3">Electrical</SelectItem>
                          <SelectItem value="Plaster" className="py-3">Plaster</SelectItem>
                          <SelectItem value="Cleaning" className="py-3">Cleaning</SelectItem>
                          <SelectItem value="Other" className="py-3">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-12">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="open" className="py-3">Open</SelectItem>
                          <SelectItem value="in_progress" className="py-3">In Progress</SelectItem>
                          <SelectItem value="resolved" className="py-3">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-12">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="low" className="py-3">Low</SelectItem>
                          <SelectItem value="medium" className="py-3">Medium</SelectItem>
                          <SelectItem value="high" className="py-3">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Assigned To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-12">
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="DCAS" className="py-3">DCAS</SelectItem>
                          <SelectItem value="OCA" className="py-3">OCA</SelectItem>
                          <SelectItem value="Self" className="py-3">Self</SelectItem>
                          <SelectItem value="Outside_Vendor" className="py-3">Outside Vendor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-background pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10 sm:h-12">
                Cancel
              </Button>
              <Button type="submit" className="h-10 sm:h-12">
                Update Issue
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}