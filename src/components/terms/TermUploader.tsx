import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload, FileText, Check, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import * as React from "react";

const formSchema = z.object({
  termName: z.string().min(1, "Term name is required"),
  termNumber: z.string().min(1, "Term number is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  description: z.string().optional(),
  pdfFile: z.instanceof(File, { message: "Please upload a PDF file" })
    .refine(file => file.size < 10000000, "File size must be less than 10MB")
    .refine(file => file.type === "application/pdf", "File must be a PDF"),
});

export function TermUploader() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      termName: "",
      termNumber: "",
      location: "",
      description: "",
    },
  });

  const watchPdfFile = form.watch("pdfFile");

  React.useEffect(() => {
    // Create object URL for PDF preview when file is selected
    if (watchPdfFile && watchPdfFile instanceof File) {
      const fileUrl = URL.createObjectURL(watchPdfFile);
      setPdfPreviewUrl(fileUrl);
      
      // Clean up object URL on unmount
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [watchPdfFile]);

  const processPdfContent = async (termId: string, pdfUrl: string) => {
    try {
      // Call the edge function to process the PDF
      const { data, error } = await supabase.functions.invoke('parse-term-sheet', {
        body: { term_id: termId, pdf_url: pdfUrl },
      });

      if (error) {
        throw new Error(`Error processing PDF: ${error.message}`);
      }

      console.log("PDF processing result:", data);
      return data;
    } catch (error) {
      console.error("Error calling parse-term-sheet function:", error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true);
      setCurrentStep(1);
      
      // 1. Upload the PDF to storage with progress tracking
      const fileName = `${values.termName.replace(/\s+/g, '-').toLowerCase()}-${values.termNumber}-${Date.now()}.pdf`;
      
      // Set up progress tracking
      const progressHandler = (progress: number) => {
        setUploadProgress(progress);
      };
      
      // Upload with progress
      // NOTE: actual progress tracking isn't directly supported by Supabase JS client
      // This is a placeholder for conceptual demonstration
      setUploadProgress(10);
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from('term-sheets')
        .upload(fileName, values.pdfFile);
      
      setUploadProgress(50);
      
      if (fileError) {
        throw new Error(`Error uploading file: ${fileError.message}`);
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('term-sheets')
        .getPublicUrl(fileName);
      
      setUploadProgress(70);
      setCurrentStep(2);
      
      // 2. Create the term record
      const { data: termData, error: termError } = await supabase
        .from('court_terms')
        .insert({
          term_name: values.termName,
          term_number: values.termNumber,
          location: values.location,
          start_date: values.startDate.toISOString().split('T')[0],
          end_date: values.endDate.toISOString().split('T')[0],
          description: values.description,
          pdf_url: publicUrl,
        })
        .select()
        .single();
      
      if (termError) {
        throw new Error(`Error creating term: ${termError.message}`);
      }
      
      setUploadProgress(85);
      setCurrentStep(3);
      
      // 3. Call the edge function to parse the PDF
      try {
        await processPdfContent(termData.id, publicUrl);
        setUploadProgress(100);
      } catch (parseError) {
        console.error("PDF parsing failed but term was created:", parseError);
        toast.warning("Term sheet uploaded, but PDF parsing failed. You may need to enter assignments manually.");
      }
      
      toast.success("Term sheet uploaded successfully");
      form.reset();
      navigate("/terms?tab=terms");
      
    } catch (error) {
      console.error("Error uploading term sheet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload term sheet");
    } finally {
      setIsUploading(false);
      setCurrentStep(0);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Court Term Sheet</CardTitle>
        <CardDescription>
          Upload a court term sheet PDF to extract and store court assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="termName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Fall Term 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="termNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2023-04" {...field} />
                    </FormControl>
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
                    <Input placeholder="e.g. County Courthouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
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
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
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
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return startDate && date < startDate;
                          }}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional information about this term" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pdfFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Term Sheet PDF</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...fieldProps}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a PDF file containing the court term sheet
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {pdfPreviewUrl && (
              <div className="mt-4 border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Preview
                </h3>
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-[200px] border"
                  title="PDF Preview"
                />
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {currentStep === 1 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {currentStep > 1 && <Check className="h-4 w-4 mr-2 text-green-500" />}
                    <span>Uploading PDF</span>
                  </div>
                  <span>{currentStep >= 1 ? (currentStep === 1 ? `${uploadProgress}%` : '100%') : '0%'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {currentStep === 2 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {currentStep > 2 && <Check className="h-4 w-4 mr-2 text-green-500" />}
                    <span>Creating Term Record</span>
                  </div>
                  <span>{currentStep >= 2 ? (currentStep === 2 ? 'Processing...' : 'Done') : 'Waiting...'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {currentStep === 3 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {currentStep > 3 && <Check className="h-4 w-4 mr-2 text-green-500" />}
                    <span>Parsing PDF Content</span>
                  </div>
                  <span>{currentStep >= 3 ? (currentStep === 3 ? 'Extracting data...' : 'Done') : 'Waiting...'}</span>
                </div>
                
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === 1 ? "Uploading..." : 
                   currentStep === 2 ? "Creating Term..." : 
                   currentStep === 3 ? "Parsing PDF..." : "Processing..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Term Sheet
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
