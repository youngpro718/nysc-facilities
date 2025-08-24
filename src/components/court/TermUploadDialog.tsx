import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Upload, FileText, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PdfUploadArea } from "./PdfUploadArea";
import { AssignmentPreview } from "./AssignmentPreview";
import { TermTemplateBuilder } from "./TermTemplateBuilder";
import { ParsedTermData, ParsedAssignment } from "@/utils/pdfParser";

interface TermUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (termId: string) => void;
}

export const TermUploadDialog = ({ open, onOpenChange, onCreated }: TermUploadDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    term_name: "",
    term_number: "",
    location: "",
    description: "",
    notes: "",
    pdf_url: "",
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTermData | null>(null);
  const [assignments, setAssignments] = useState<ParsedAssignment[]>([]);
  const [currentTab, setCurrentTab] = useState("upload");
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false);

  // Strict validation for external PDF URLs: only allow HTTPS and .pdf extension
  const isValidPdfUrl = (urlStr: string) => {
    try {
      const url = new URL(urlStr.trim());
      const isHttps = url.protocol === 'https:';
      const hasPdfPath = url.pathname.toLowerCase().endsWith('.pdf');
      return isHttps && hasPdfPath;
    } catch {
      return false;
    }
  };

  const handlePdfParsed = (data: ParsedTermData) => {
    setParsedData(data);
    setAssignments(data.assignments);
    
    // Auto-fill form data from parsed PDF
    if (data.termName && !formData.term_name) {
      setFormData(prev => ({ ...prev, term_name: data.termName! }));
    }
    if (data.location && !formData.location) {
      setFormData(prev => ({ ...prev, location: data.location! }));
    }
    
    setCurrentTab("preview");
  };

  const handleFileUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, pdf_url: url }));
  };

  const handleTemplateAssignments = (templateAssignments: any[]) => {
    const formattedAssignments: ParsedAssignment[] = templateAssignments.map((ta) => {
      const mapped: ParsedAssignment = {
        partCode: ta.part,
        justiceName: ta.justice,
        roomNumber: ta.room_number || undefined,
        clerkNames: ta.clerks || [],
        sergeantName: ta.sergeant || undefined,
      };

      // Map telephone to either extension or phone depending on format
      if (ta.tel) {
        const telStr = String(ta.tel).trim();
        if (/^\d{3,5}$/.test(telStr)) {
          mapped.extension = telStr;
        } else {
          mapped.phone = telStr;
        }
      }

      if (ta.fax) {
        mapped.fax = String(ta.fax).trim();
      }

      return mapped;
    });
    setAssignments(formattedAssignments);
    setCurrentTab("preview");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (startDate >= endDate) {
      toast({
        title: "Error",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate external PDF URL if provided
    if (formData.pdf_url && !isValidPdfUrl(formData.pdf_url)) {
      toast({
        title: "Invalid PDF URL",
        description: "Only HTTPS links ending with .pdf are allowed.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Create the term first
      const { data: termData, error: termError } = await supabase
        .from("court_terms")
        .insert({
          ...formData,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          status: "active",
          term_status: startDate > new Date() ? "upcoming" : "active",
        })
        .select('id')
        .single();

      if (termError) throw termError;

      // Notify parent that a term was created
      onCreated?.(termData.id);

      // If we have assignments, process them via the edge function (background, non-blocking)
      if (assignments.length > 0 && formData.pdf_url) {
        // Fire-and-forget to avoid blocking the UI on long-running processing
        supabase.functions
          .invoke('parse-term-sheet', {
            body: {
              term_id: termData.id,
              pdf_url: formData.pdf_url,
              client_extracted: { assignments }
            }
          })
          .then(({ data, error }) => {
            if (error) {
              console.warn('Edge function error:', error);
            } else {
              console.log('Processing result:', data);
            }
          })
          .catch((err) => {
            console.warn('Failed to invoke parse-term-sheet:', err);
          });
      }

      toast({
        title: "Term Created",
        description: `Successfully created term with ${assignments.length} assignments. Assignments are being processed in the background.`,
      });

      // Reset form
      setFormData({
        term_name: "",
        term_number: "",
        location: "",
        description: "",
        notes: "",
        pdf_url: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
      setParsedData(null);
      setAssignments([]);
      setCurrentTab("upload");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create court term. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Court Term
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload PDF / Quick Build</TabsTrigger>
            <TabsTrigger value="preview" disabled={!parsedData && assignments.length === 0}>Preview & Edit</TabsTrigger>
            <TabsTrigger value="details">Term Details</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Upload PDF</h3>
                <PdfUploadArea
                  onPdfParsed={handlePdfParsed}
                  onFileUploaded={handleFileUploaded}
                  disabled={isUploading}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">Quick Build</h3>
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Create assignments quickly using templates from previous terms
                  </p>
                  <Button onClick={() => setTemplateBuilderOpen(true)}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Open Template Builder
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <AssignmentPreview
              assignments={assignments}
              onAssignmentsUpdate={setAssignments}
            />
            <div className="flex justify-end">
              <Button onClick={() => setCurrentTab("details")}>
                Continue to Term Details
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="term_name">Term Name *</Label>
              <Input
                id="term_name"
                value={formData.term_name}
                onChange={(e) => setFormData(prev => ({ ...prev, term_name: e.target.value }))}
                placeholder="e.g., January 2024 Criminal Term"
                required
              />
            </div>

            <div>
              <Label htmlFor="term_number">Term Number *</Label>
              <Input
                id="term_number"
                value={formData.term_number}
                onChange={(e) => setFormData(prev => ({ ...prev, term_number: e.target.value }))}
                placeholder="e.g., 2024-01"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Supreme Court Building"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the court term"
            />
          </div>

          <div>
            <Label htmlFor="pdf_url">PDF URL (Optional)</Label>
            <Input
              id="pdf_url"
              value={formData.pdf_url}
              onChange={(e) => setFormData(prev => ({ ...prev, pdf_url: e.target.value }))}
              placeholder="https://example.com/term-schedule.pdf"
            />
          </div>

          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal notes for court operations"
            />
          </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Create Term ({assignments.length} assignments)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        <TermTemplateBuilder
          open={templateBuilderOpen}
          onOpenChange={setTemplateBuilderOpen}
          onAssignmentsCreated={handleTemplateAssignments}
        />
      </DialogContent>
    </Dialog>
  );
};