import { useState } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TermDataVerification } from './TermDataVerification';
import { TermVisualImporter } from './TermVisualImporter';
import { createTermFromOCR } from '../services/termImportService';
import { createTermFromManualInput } from '../services/manualTermImport';
import { TermImportData } from '../types/termTypes';
import { Upload, Loader2, PenLine, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TermImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: TermImportData) => void;
}

export function TermImportDialog({ open, onClose, onSuccess }: TermImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<TermImportData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [manualInput, setManualInput] = useState<string>('');
  const [isVisualMode, setIsVisualMode] = useState<boolean>(false);
  
  const handleSubmit = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    toast({
      title: "Processing Document",
      description: "Starting document processing...",
    });
    
    try {
      console.log('Starting document processing for file:', file.name);
      
      // Process document with OCR
      const termData = await createTermFromOCR(file);
      console.log('Document processed successfully:', termData);
      
      // Show preview of extracted data
      setExtractedData(termData);
      
      toast({
        title: "Document Processed",
        description: "Document successfully processed. Please verify the extracted data.",
      });
    } catch (error) {
      console.error('Error processing term document:', error);
      toast({
        title: "Processing Error",
        description: "Failed to extract data from the document. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Additional information about table format support
  const isTableFormatSupported = file?.name?.toLowerCase().includes('term') || 
                               file?.name?.toLowerCase().includes('court') || 
                               file?.type?.includes('pdf') || 
                               file?.type?.includes('image/');
  
  const resetForm = () => {
    setFile(null);
    setExtractedData(null);
    setManualInput('');
    setIsVisualMode(false);
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handleVisualMode = () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file first.",
        variant: "destructive",
      });
      return;
    }
    setIsVisualMode(true);
  };
  
  // Handler for manual input processing
  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter the term schedule text to process.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    toast({
      title: "Processing Input",
      description: "Analyzing your text data...",
    });
    
    try {
      console.log('Processing manual text input, length:', manualInput.length);
      
      // Process the manual input
      const termData = await createTermFromManualInput(manualInput);
      console.log('Text processed successfully:', termData);
      
      // Show preview of extracted data
      setExtractedData(termData);
      
      toast({
        title: "Text Processed",
        description: "Your data has been analyzed. Please verify the extracted information.",
      });
    } catch (error) {
      console.error('Error processing manual input:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process your text. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Sample text for the manual input textarea
  const sampleText = `SUPREME COURT - CRIMINAL TERM
APRIL 13, 2025 - MAY 15, 2025
LOCATION: 100 CENTRE STREET

ADMINISTRATIVE JUDGE: HON. ELLEN BIBEN (646-386-4000)
CHIEF CLERK: JOHN SMITH (646-386-4001)

PART ASSIGNMENTS:
TAP A - HON. M. LEWIS - ROOM 1180 - 646-386-4107
CLERK: A. WRIGHT, A. SARMIENTO

TAP B - HON. S. LITMAN - ROOM 1130 - 646-386-4044
CLERK: T. GREENDGE, C. WELDON

PART 1 - HON. J. WASHINGTON - ROOM 1220 - 646-386-4033
CLERK: J. RODRIGUEZ`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={isVisualMode ? "sm:max-w-[90%] max-h-[90vh] overflow-auto" : "sm:max-w-[700px]"}>
        <DialogHeader>
          <DialogTitle>Import Court Term Schedule</DialogTitle>
          <DialogDescription>
            Import term schedule by uploading a document or entering the text directly.
          </DialogDescription>
        </DialogHeader>
        
        {isVisualMode ? (
          <TermVisualImporter
            file={file!}
            onSave={data => {
              setExtractedData(data);
              setIsVisualMode(false);
            }}
            onCancel={() => setIsVisualMode(false)}
          />
        ) : !extractedData ? (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4 pt-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="term-file">Term Schedule Document</Label>
                <Input 
                  id="term-file" 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: PDF, PNG, JPG
                </p>
                {file && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-blue-700 dark:text-blue-300 text-sm">
                    <p className="font-semibold">Visual Data Entry Available</p>
                    <p className="mb-2">Use our visual data entry tool to precisely enter data while viewing the document.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-blue-100 dark:bg-blue-900"
                      onClick={handleVisualMode}
                    >
                      <FileImage className="mr-2 h-4 w-4" />
                      Use Visual Data Entry
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="border rounded-md p-4 bg-muted/20">
                <h4 className="font-medium mb-2">Processing Information</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>The document should include the term number, date range, and court assignments</li>
                  <li>For best results, ensure the document is clearly legible</li>
                  <li>You'll have a chance to review and edit the extracted data before final import</li>
                </ul>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!file || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Process Document
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4 pt-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="manual-input">Term Schedule Text</Label>
                <Textarea 
                  id="manual-input"
                  placeholder="Enter the term schedule text here..."
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Enter the text content of your term schedule
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setManualInput(sampleText)}
                  >
                    Insert Sample
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/20">
                <h4 className="font-medium mb-2">Text Format Guidelines</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Include term name, date range, and location at the top</li>
                  <li>List administrative personnel (judges, clerks) with their roles</li>
                  <li>Format assignments as: PART - JUSTICE - ROOM - PHONE</li>
                  <li>Use separate lines for clerks assigned to each part</li>
                </ul>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualSubmit} 
                  disabled={!manualInput.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PenLine className="mr-2 h-4 w-4" />
                      Process Text
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        ) : (
          <TermDataVerification 
            data={extractedData} 
            onConfirm={confirmedData => {
              onSuccess(confirmedData);
              handleClose();
            }}
            onCancel={() => setExtractedData(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
