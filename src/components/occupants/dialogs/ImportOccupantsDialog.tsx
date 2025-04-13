import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Download, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Define the schema for occupant data
const occupantSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "on_leave", "terminated"]).default("active"),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type OccupantImport = z.infer<typeof occupantSchema>;

interface ImportOccupantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportOccupantsDialog({ open, onOpenChange, onSuccess }: ImportOccupantsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<OccupantImport[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ total: 0, success: 0, failed: 0 });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };
  
  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const parsedOccupants: OccupantImport[] = [];
        const errors: Record<number, string[]> = {};
        
        data.forEach((row, index) => {
          // Convert empty strings to null
          Object.keys(row).forEach(key => {
            if (row[key] === "") {
              row[key] = null as any;
            }
          });
          
          // Validate against schema
          const result = occupantSchema.safeParse(row);
          if (result.success) {
            parsedOccupants.push(result.data);
          } else {
            errors[index] = result.error.errors.map(err => 
              `${err.path.join('.')}: ${err.message}`
            );
          }
        });
        
        setParsedData(parsedOccupants);
        setValidationErrors(errors);
        setUploadStats({
          total: data.length,
          success: parsedOccupants.length,
          failed: Object.keys(errors).length
        });
      }
    });
  };
  
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "No valid data to import",
        description: "Please fix the validation errors or upload a new file.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      let successCount = 0;
      
      for (let i = 0; i < parsedData.length; i++) {
        const occupant = parsedData[i];
        
        // Transform emergency contact data to match database schema
        const occupantData = {
          first_name: occupant.first_name,
          last_name: occupant.last_name,
          email: occupant.email,
          phone: occupant.phone,
          department: occupant.department,
          position: occupant.position,
          status: occupant.status,
          emergency_contact: occupant.emergency_contact_name ? {
            name: occupant.emergency_contact_name,
            phone: occupant.emergency_contact_phone
          } : null,
          notes: occupant.notes
        };
        
        const { error } = await supabase
          .from("occupants")
          .insert(occupantData);
        
        if (!error) {
          successCount++;
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / parsedData.length) * 100);
        setUploadProgress(progress);
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["occupants"] });
      queryClient.invalidateQueries({ queryKey: ["occupant-stats"] });
      
      toast({
        title: "Import successful",
        description: `Successfully imported ${successCount} out of ${parsedData.length} occupants.`,
      });
      
      // Reset state
      setFile(null);
      setParsedData([]);
      setValidationErrors({});
      
      // Close dialog
      onOpenChange(false);
      
      // Call success callback
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred while importing occupants.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const downloadTemplate = () => {
    const headers = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "department",
      "position",
      "status",
      "emergency_contact_name",
      "emergency_contact_phone",
      "notes"
    ];
    
    const csvContent = Papa.unparse({
      fields: headers,
      data: [
        {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone: "555-123-4567",
          department: "IT",
          position: "Developer",
          status: "active",
          emergency_contact_name: "Jane Doe",
          emergency_contact_phone: "555-987-6543",
          notes: "Example data"
        }
      ]
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "occupants_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const resetFile = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Occupants</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import occupants. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!file ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
                <Button variant="secondary" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <Tabs defaultValue="preview">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {file.name}
                  </Badge>
                  <Badge variant={uploadStats.failed > 0 ? "destructive" : "default"}>
                    {uploadStats.success} valid / {uploadStats.failed} invalid
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={resetFile}>
                    <X className="h-4 w-4 mr-1" />
                    Change File
                  </Button>
                  <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-1" />
                    Template
                  </Button>
                </div>
              </div>
              
              <TabsList>
                <TabsTrigger value="preview">Data Preview</TabsTrigger>
                <TabsTrigger value="errors">
                  Validation Errors
                  {Object.keys(validationErrors).length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {Object.keys(validationErrors).length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview">
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((occupant, index) => (
                        <TableRow key={index}>
                          <TableCell>{occupant.first_name}</TableCell>
                          <TableCell>{occupant.last_name}</TableCell>
                          <TableCell>{occupant.email || "-"}</TableCell>
                          <TableCell>{occupant.department || "-"}</TableCell>
                          <TableCell>{occupant.position || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              occupant.status === "active" ? "default" :
                              occupant.status === "inactive" ? "secondary" :
                              occupant.status === "on_leave" ? "outline" : "destructive"
                            }>
                              {occupant.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsedData.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                            Showing 10 of {parsedData.length} records
                          </TableCell>
                        </TableRow>
                      )}
                      {parsedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No valid data found in CSV
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="errors">
                {Object.keys(validationErrors).length > 0 ? (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Validation Errors</AlertTitle>
                      <AlertDescription>
                        Please fix the following errors in your CSV file and upload again.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Errors</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(validationErrors).map(([row, errors]) => (
                            <TableRow key={row}>
                              <TableCell>Row {parseInt(row) + 2}</TableCell>
                              <TableCell>
                                <ul className="list-disc list-inside">
                                  {errors.map((error, i) => (
                                    <li key={i} className="text-sm">{error}</li>
                                  ))}
                                </ul>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Check className="h-10 w-10 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">All Data is Valid</h3>
                    <p className="text-sm text-muted-foreground">
                      No validation errors found in your CSV file.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedData.length === 0 || isUploading}
          >
            {isUploading ? "Importing..." : "Import Occupants"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
