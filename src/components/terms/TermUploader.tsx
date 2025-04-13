import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, CalendarRange, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Term, TermUploadResponse } from "./types/termTypes";

const termSchema = z.object({
  term_name: z.string().min(1, "Term name is required"),
  term_number: z.string().min(1, "Term number is required"),
  location: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  description: z.string().optional(),
});

type TermFormValues = z.infer<typeof termSchema>;

export function TermUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<TermUploadResponse | null>(null);

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      term_name: "",
      term_number: "",
      location: "",
      start_date: "",
      end_date: "",
      description: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const onSubmit = async (values: TermFormValues) => {
    try {
      setIsUploading(true);
      setUploadResult(null);
      
      if (!file) {
        toast.error("Please select a PDF file to upload");
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('term-sheets')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: urlData } = await supabase.storage
        .from('term-sheets')
        .getPublicUrl(filePath);
        
      const pdfUrl = urlData.publicUrl;
      
      const { data: termData, error: termError } = await supabase
        .from('court_terms')
        .insert({
          term_name: values.term_name,
          term_number: values.term_number,
          location: values.location || 'New York County',
          start_date: values.start_date,
          end_date: values.end_date,
          description: values.description,
          pdf_url: pdfUrl,
        })
        .select()
        .single();
        
      if (termError) {
        throw termError;
      }
      
      const termId = termData.id;
      const parseFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-term-sheet?term_id=${termId}&pdf_url=${encodeURIComponent(pdfUrl)}`;
      
      const response = await fetch(parseFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
          'Content-Type': 'application/json',
        },
      });
      
      const parsedResult = await response.json();
      
      setUploadResult({
        success: true,
        message: "Term sheet uploaded successfully and scheduled for processing",
        term_id: termId,
      });
      
      form.reset();
      setFile(null);
      
      toast.success("Term sheet uploaded successfully");
      
    } catch (error) {
      console.error("Error uploading term sheet:", error);
      setUploadResult({
        success: false,
        message: "Failed to upload term sheet",
        errors: [(error as Error).message],
      });
      toast.error("Failed to upload term sheet");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Term Sheet</CardTitle>
        <CardDescription>
          Upload a term sheet PDF to automatically extract court part assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="term_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Spring Term 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="term_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2025-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New York County" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add notes about this term sheet" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormLabel>Term Sheet PDF</FormLabel>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  {file ? file.name : "Drag and drop or click to select a PDF file"}
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" size="sm" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Maximum file size: 10MB
                </p>
              </div>
            </div>
            
            {uploadResult && (
              <Alert variant={uploadResult.success ? "default" : "destructive"}>
                {uploadResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{uploadResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>
                  {uploadResult.message}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <ul className="list-disc pl-5 mt-2">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <CalendarRange className="mr-2 h-4 w-4" />
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
