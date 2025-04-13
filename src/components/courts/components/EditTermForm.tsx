import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CourtTerm } from "../types/termTypes";
import { useTermDetails } from "../hooks/useTerms";

// Form schema with validation
const formSchema = z.object({
  term_number: z.string().min(1, { message: "Term number is required" }),
  term_name: z.string().min(2, { message: "Term name is required" }),
  description: z.string().optional(),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date({ required_error: "End date is required" }),
  location: z.string().min(1, { message: "Location is required" }),
})
.refine(data => data.end_date >= data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type FormValues = z.infer<typeof formSchema>;

interface EditTermFormProps {
  termId: string;
  onSuccess?: () => void;
}

export function EditTermForm({ termId, onSuccess }: EditTermFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { term, updateTerm, isUpdating, isLoading, error } = useTermDetails(termId);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term_number: "",
      term_name: "",
      description: "",
      location: "",
    },
  });

  // Set form values when term data is loaded
  useEffect(() => {
    if (term) {
      form.reset({
        term_number: term.term_number,
        term_name: term.term_name,
        description: term.description || "",
        start_date: new Date(term.start_date),
        end_date: new Date(term.end_date),
        location: term.location,
      });
    }
  }, [term, form]);

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    updateTerm({
      term_number: data.term_number,
      term_name: data.term_name,
      description: data.description,
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.end_date.toISOString().split('T')[0],
      location: data.location,
    }, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        } else {
          // Default behavior - navigate back to term details
          router.push(`/courts/terms/${termId}`);
        }
      }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading term data...</div>;
  }

  if (error || !term) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-destructive mb-4">Error loading term data</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Court Term</CardTitle>
        <CardDescription>
          Update information for the court term.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="term_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2024-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="term_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spring 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description of the court term"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New York County Supreme Court" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 