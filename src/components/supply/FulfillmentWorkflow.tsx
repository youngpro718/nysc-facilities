import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Package, Truck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { advanceFulfillmentStage, getFulfillmentLog } from "@/services/supabase/supplyRequestService";

interface FulfillmentWorkflowProps {
  request: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FULFILLMENT_STAGES = [
  { value: 'assigned', label: 'Assign to Staff', icon: User, description: 'Assign fulfillment to a team member' },
  { value: 'picking', label: 'Start Picking', icon: Package, description: 'Begin collecting items from inventory' },
  { value: 'picked', label: 'Complete Picking', icon: CheckCircle, description: 'All items have been collected' },
  { value: 'packing', label: 'Start Packing', icon: Package, description: 'Begin packaging items for delivery' },
  { value: 'packed', label: 'Complete Packing', icon: CheckCircle, description: 'Items are packed and ready' },
  { value: 'ready_for_delivery', label: 'Ready for Pickup', icon: Truck, description: 'Items are ready for pickup/delivery' },
  { value: 'completed', label: 'Mark Complete', icon: CheckCircle, description: 'Delivery confirmed and completed' }
];

const STAGE_COLORS: Record<string, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'assigned': 'bg-blue-100 text-blue-800',
  'picking': 'bg-yellow-100 text-yellow-800',
  'picked': 'bg-green-100 text-green-800',
  'packing': 'bg-orange-100 text-orange-800',
  'packed': 'bg-purple-100 text-purple-800',
  'ready_for_delivery': 'bg-cyan-100 text-cyan-800',
  'completed': 'bg-emerald-100 text-emerald-800'
};

export function FulfillmentWorkflow({ request, isOpen, onClose, onSuccess }: FulfillmentWorkflowProps) {
  const { toast } = useToast();
  const [selectedStage, setSelectedStage] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [fulfillmentCost, setFulfillmentCost] = useState('');
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

  const getCurrentStage = () => {
    return request?.fulfillment_stage || 'pending';
  };

  const getNextValidStages = () => {
    const currentStage = getCurrentStage();
    
    switch (currentStage) {
      case 'pending':
        return ['assigned'];
      case 'assigned':
        return ['picking'];
      case 'picking':
        return ['picked'];
      case 'picked':
        return ['packing'];
      case 'packing':
        return ['packed'];
      case 'packed':
        return ['ready_for_delivery'];
      case 'ready_for_delivery':
        return ['completed'];
      default:
        return [];
    }
  };

  const handleAdvanceStage = async () => {
    if (!selectedStage) return;

    setIsLoading(true);
    try {
      const metadata: any = {};
      
      if (selectedStage === 'ready_for_delivery') {
        metadata.delivery_method = deliveryMethod;
        metadata.delivery_location = deliveryLocation;
      }
      
      if (selectedStage === 'completed' && fulfillmentCost) {
        metadata.fulfillment_cost = parseFloat(fulfillmentCost);
      }

      await advanceFulfillmentStage(request.id, selectedStage, notes, metadata);
      
      toast({
        title: "Stage Updated",
        description: `Fulfillment stage advanced to ${FULFILLMENT_STAGES.find(s => s.value === selectedStage)?.label}`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to advance fulfillment stage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const currentStage = getCurrentStage();
  const nextValidStages = getNextValidStages();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fulfillment Workflow - {request?.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={STAGE_COLORS[currentStage] || 'bg-gray-100 text-gray-800'}>
                {FULFILLMENT_STAGES.find(s => s.value === currentStage)?.label || currentStage}
              </Badge>
              
              {request?.assigned_fulfiller_id && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Assigned To:</Label>
                  <p className="text-sm text-muted-foreground">Staff Member</p>
                </div>
              )}

              {request?.delivery_location && (
                <div className="mt-2">
                  <Label className="text-sm font-medium">Delivery Location:</Label>
                  <p className="text-sm text-muted-foreground">{request.delivery_location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Action */}
          <Card>
            <CardHeader>
              <CardTitle>Next Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextValidStages.length > 0 ? (
                <>
                  <div>
                    <Label htmlFor="stage">Select Next Stage</Label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose next stage..." />
                      </SelectTrigger>
                      <SelectContent>
                        {nextValidStages.map(stageValue => {
                          const stage = FULFILLMENT_STAGES.find(s => s.value === stageValue);
                          return (
                            <SelectItem key={stageValue} value={stageValue}>
                              <div className="flex items-center gap-2">
                                {stage?.icon && <stage.icon className="h-4 w-4" />}
                                <div>
                                  <div className="font-medium">{stage?.label}</div>
                                  <div className="text-xs text-muted-foreground">{stage?.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStage === 'ready_for_delivery' && (
                    <>
                      <div>
                        <Label htmlFor="delivery-method">Delivery Method</Label>
                        <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pickup">Pickup</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="internal_mail">Internal Mail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="delivery-location">Delivery Location</Label>
                        <Input
                          id="delivery-location"
                          value={deliveryLocation}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          placeholder="Enter pickup/delivery location..."
                        />
                      </div>
                    </>
                  )}

                  {selectedStage === 'completed' && (
                    <div>
                      <Label htmlFor="fulfillment-cost">Fulfillment Cost (Optional)</Label>
                      <Input
                        id="fulfillment-cost"
                        type="number"
                        step="0.01"
                        value={fulfillmentCost}
                        onChange={(e) => setFulfillmentCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this stage..."
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Fulfillment workflow completed!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fulfillment Log */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Fulfillment History</CardTitle>
            </CardHeader>
            <CardContent>
              {fulfillmentLog.length > 0 ? (
                <div className="space-y-3">
                  {fulfillmentLog.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge className={STAGE_COLORS[log.stage] || 'bg-gray-100 text-gray-800'}>
                        {FULFILLMENT_STAGES.find(s => s.value === log.stage)?.label || log.stage}
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
                <p className="text-center text-muted-foreground py-4">No fulfillment history yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {nextValidStages.length > 0 && (
            <Button 
              onClick={handleAdvanceStage} 
              disabled={!selectedStage || isLoading}
            >
              {isLoading ? 'Processing...' : 'Advance Stage'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}