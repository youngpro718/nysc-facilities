
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { toast } from "sonner";
import { useState } from "react";

interface DescriptionFieldProps {
  form: UseFormReturn<FormData>;
}

export function DescriptionField({ form }: DescriptionFieldProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleDictation = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      form.setValue('description', 
        (form.getValues('description') + ' ' + transcript).trim()
      );
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      toast.error("Failed to record audio");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <div className="relative">
            <FormControl>
              <Textarea {...field} placeholder="Describe the issue" />
            </FormControl>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleDictation}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 text-destructive animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
