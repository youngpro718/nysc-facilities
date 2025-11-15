import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Play, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { startSupplyRequestWork, completeSupplyRequestWork, getFulfillmentLog } from "@/lib/supabase";

interface FulfillmentWorkflowProps {
  request: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FulfillmentWorkflow({ request, isOpen, onClose, onSuccess }: FulfillmentWorkflowProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [fulfillmentLog, setFulfillmentLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && request?.id) {
      loadFulfillmentLog();
    }
  }, [isOpen, request?.id]);

  const loadFulfillmentLog = async () => {
    try {
      const log = await getFulfillmentLog(request.id);
      setFulfillmentLog(log || []);
    } catch (error) {
      console.error('Error loading fulfillment log:', error);
    }
  };

  const handleStartWork = async () => {
    setIsLoading(true);
    try {
      await startSupplyRequestWork(request.id);
      
      toast({
        title: "Work Started",
        description: "You have started working on this supply request",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start work",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteWork = async () => {
    setIsLoading(true);
    try {
      await completeSupplyRequestWork(request.id, notes || undefined);
      
      toast({
        title: "Work Completed",
        description: "Supply request has been fulfilled and inventory updated",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete work",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const canStartWork = request?.status === 'approved' && !request?.work_started_at;
  const canCompleteWork = request?.work_started_at && !request?.work_completed_at;
  const isCompleted = request?.work_completed_at;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fulfillment Workflow - {request?.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Work Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge 
                  className={
                    isCompleted 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : canCompleteWork 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {isCompleted ? 'Completed' : canCompleteWork ? 'In Progress' : 'Pending'}
                </Badge>
              </div>

              {request?.work_started_at && (
                <div>
                  <Label className="text-sm font-medium">Work Started:</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(request.work_started_at)}
                  </p>
                </div>
              )}

              {request?.work_completed_at && (
                <div>
                  <Label className="text-sm font-medium">Work Completed:</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(request.work_completed_at)}
                  </p>
                </div>
              )}

              {request?.work_duration_minutes && (
                <div>
                  <Label className="text-sm font-medium">Duration:</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(request.work_duration_minutes)}
                  </p>
                </div>
              )}

              {request?.assigned_fulfiller_id && (
                <div>
                  <Label className="text-sm font-medium">Assigned To:</Label>
                  <p className="text-sm text-muted-foreground">Staff Member</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canStartWork && (
                <Button 
                  onClick={handleStartWork} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? 'Starting...' : 'Start Work'}
                </Button>
              )}

              {canCompleteWork && (
                <>
                  <div>
                    <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
                    <Textarea
                      id="completion-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about the completion..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleCompleteWork} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isLoading ? 'Completing...' : 'Complete Work'}
                  </Button>
                </>
              )}

              {isCompleted && (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Work completed successfully!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work History */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Work History</CardTitle>
            </CardHeader>
            <CardContent>
              {fulfillmentLog.length > 0 ? (
                <div className="space-y-3">
                  {fulfillmentLog.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge className={
                        log.stage === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.stage === 'in_progress' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {log.stage === 'in_progress' ? 'Started' : 'Completed'}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {log.profiles?.first_name} {log.profiles?.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No work history yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}