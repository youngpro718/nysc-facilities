import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Trash2, 
  UserCheck, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssignments: string[];
  assignments: any[];
  onSuccess: () => void;
}

export function BulkOperationsDialog({
  isOpen,
  onClose,
  selectedAssignments,
  assignments,
  onSuccess
}: BulkOperationsDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    successful: string[];
    failed: { id: string; error: string }[];
  }>({ successful: [], failed: [] });
  const [operationType, setOperationType] = useState<'delete' | 'expire' | 'renew' | 'reassign'>('delete');

  const selectedAssignmentData = assignments.filter(a => selectedAssignments.includes(a.id));

  const handleBulkOperation = async () => {
    if (selectedAssignments.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setResults({ successful: [], failed: [] });

    const batchSize = 5; // Process in batches to avoid overwhelming the database
    const batches = [];
    
    for (let i = 0; i < selectedAssignments.length; i += batchSize) {
      batches.push(selectedAssignments.slice(i, i + batchSize));
    }

    let processedCount = 0;
    const successful: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(async (assignmentId) => {
        try {
          switch (operationType) {
            case 'delete':
              await deleteAssignment(assignmentId);
              break;
            case 'expire':
              await expireAssignment(assignmentId);
              break;
            case 'renew':
              await renewAssignment(assignmentId);
              break;
            case 'reassign':
              // This would require additional parameters
              throw new Error('Bulk reassignment requires room selection');
          }
          successful.push(assignmentId);
        } catch (error) {
          failed.push({
            id: assignmentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        processedCount++;
        setProgress((processedCount / selectedAssignments.length) * 100);
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches to prevent overwhelming the database
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setResults({ successful, failed });
    setIsProcessing(false);

    if (successful.length > 0) {
      toast.success(`Successfully processed ${successful.length} assignments`);
      onSuccess();
    }

    if (failed.length > 0) {
      toast.error(`Failed to process ${failed.length} assignments`);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from('occupant_room_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (error) throw error;
  };

  const expireAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from('occupant_room_assignments')
      .update({ 
        expiration_date: new Date().toISOString(),
        notes: 'Bulk expired'
      })
      .eq('id', assignmentId);
    
    if (error) throw error;
  };

  const renewAssignment = async (assignmentId: string) => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const { error } = await supabase
      .from('occupant_room_assignments')
      .update({ 
        expiration_date: futureDate.toISOString(),
        notes: 'Bulk renewed for 1 year'
      })
      .eq('id', assignmentId);
    
    if (error) throw error;
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setResults({ successful: [], failed: [] });
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Operations
          </DialogTitle>
          <DialogDescription>
            Perform operations on {selectedAssignments.length} selected assignments
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="operation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="operation">Operation</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="operation" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={operationType === 'delete' ? 'destructive' : 'outline'}
                onClick={() => setOperationType('delete')}
                className="justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant={operationType === 'expire' ? 'default' : 'outline'}
                onClick={() => setOperationType('expire')}
                className="justify-start"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Expire
              </Button>
              <Button
                variant={operationType === 'renew' ? 'default' : 'outline'}
                onClick={() => setOperationType('renew')}
                className="justify-start"
              >
                <Clock className="h-4 w-4 mr-2" />
                Renew
              </Button>
              <Button
                variant={operationType === 'reassign' ? 'default' : 'outline'}
                onClick={() => setOperationType('reassign')}
                className="justify-start"
                disabled
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Reassign
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing assignments...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {results.successful.length > 0 || results.failed.length > 0 ? (
              <div className="space-y-3">
                {results.successful.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {results.successful.length} assignments processed successfully
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {results.failed.length} assignments failed
                    </div>
                    <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                      {results.failed.map((failure, index) => (
                        <div key={index}>
                          Assignment {failure.id}: {failure.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {selectedAssignmentData.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{assignment.occupant_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Room {assignment.room_number} • {assignment.assignment_type}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {assignment.is_primary ? 'Primary' : 'Secondary'}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkOperation}
            disabled={isProcessing || selectedAssignments.length === 0}
            variant={operationType === 'delete' ? 'destructive' : 'default'}
          >
            {isProcessing ? 'Processing...' : `${operationType} ${selectedAssignments.length} Assignment${selectedAssignments.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}