
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
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lg font-medium">Title</FormLabel>
            <FormDescription>
              Provide a clear, concise title that describes the issue
            </FormDescription>
            <FormControl>
              <Input 
                {...field} 
                className="h-12 text-base bg-background/50 border-white/10" 
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
            <FormLabel className="text-lg font-medium">Description</FormLabel>
            <FormDescription>
              Provide detailed information about the issue, including any relevant context
            </FormDescription>
            <FormControl>
              <div className="min-h-[300px] rounded-md border border-white/10 bg-background/50 overflow-hidden">
                <EditorContent 
                  editor={editor} 
                  className="prose prose-invert max-w-none p-4 min-h-[300px]"
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
