
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../../types/IssueTypes";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface IssueDetailsFormProps {
  form: UseFormReturn<FormData>;
}

export function IssueDetailsForm({ form }: IssueDetailsFormProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: form.getValues('description') || '',
    onUpdate: ({ editor }) => {
      form.setValue('description', editor.getHTML());
    },
  });

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Title</FormLabel>
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
            <FormLabel className="text-base font-medium">Description</FormLabel>
            <FormDescription>
              Provide detailed information about the issue, including any relevant context
            </FormDescription>
            <FormControl>
              <div className="min-h-[200px] rounded-md border border-white/10 bg-background/50 overflow-hidden">
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
