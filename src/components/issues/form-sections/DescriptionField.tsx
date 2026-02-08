
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { logger } from '@/lib/logger';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { toast } from "sonner";
import { useState, useCallback, useEffect } from "react";

interface DescriptionFieldProps {
  form: UseFormReturn<FormData, any, undefined>;
}

export function DescriptionField({ form }: DescriptionFieldProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<Record<string, unknown> | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return null;
    }

    const recognition = new ((window as Record<string, unknown>)).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setIsInitializing(false);
      toast.success("Started recording");
    };

    recognition.onresult = (event: Record<string, unknown>) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        const currentText = form.getValues('description') || '';
        const newText = (currentText + ' ' + finalTranscript).trim();
        form.setValue('description', newText, { shouldValidate: true });
      }
    };

    recognition.onerror = (event: Record<string, unknown>) => {
      logger.error('Speech recognition error', event.error);
      setIsRecording(false);
      setIsInitializing(false);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access was denied");
      } else {
        toast.error("Error during speech recognition");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsInitializing(false);
    };

    return recognition;
  }, [form]);

  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  const handleDictation = async () => {
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    setIsInitializing(true);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const newRecognition = initializeSpeechRecognition();
      if (newRecognition) {
        setRecognition(newRecognition);
        newRecognition.start();
      }
    } catch (error) {
      logger.error('Microphone access error:', error);
      toast.error("Could not access microphone");
      setIsInitializing(false);
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
              <Textarea 
                {...field} 
                placeholder="Describe the issue" 
                className="min-h-[100px]"
              />
            </FormControl>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleDictation}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
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
