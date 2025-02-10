
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { FormData } from "../../types/IssueTypes";

interface IssueDetailsProps {
  form: UseFormReturn<FormData>;
}

export function IssueDetails({ form }: IssueDetailsProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: form.getValues("description") || "",
    onUpdate: ({ editor }) => {
      form.setValue("description", editor.getHTML());
    },
  });

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormDescription>
              Provide a clear, concise title that describes the issue
            </FormDescription>
            <FormControl>
              <Input 
                {...field} 
                className="h-12" 
                placeholder="e.g., Broken Light Fixture in Room 203"
              />
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
            <FormLabel>Description</FormLabel>
            <FormDescription>
              Provide detailed information about the issue
            </FormDescription>
            <FormControl>
              <div className="min-h-[200px] rounded-md border">
                <EditorContent 
                  editor={editor} 
                  className="prose prose-invert max-w-none p-4"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
