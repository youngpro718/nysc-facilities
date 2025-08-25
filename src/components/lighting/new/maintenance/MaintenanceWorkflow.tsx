import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  User, 
  Wrench, 
  CheckCircle,
  AlertTriangle,
  Plus,
  ExternalLink,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MaintenanceRecord {
  id: string;
  fixture_id: string;
  maintenance_type: 'routine' | 'preventive' | 'repair' | 'replacement';
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  vendor?: string;
  cost?: number;
}

interface VendorInfo {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  specialties: string[];
  rating?: number;
  notes?: string;
}

export function MaintenanceWorkflow() {
  const [selectedTab, setSelectedTab] = useState("scheduled");
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<VendorInfo>>({
    name: '',
    contact_email: '',
    contact_phone: '',
    specialties: [],
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch maintenance records
  const { data: maintenanceRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ['maintenance-records'],
    queryFn: async (): Promise<MaintenanceRecord[]> => {
      // This would fetch from a maintenance_records table
      // For now, return mock data
      return [
        {
          id: '1',
          fixture_id: 'fixture-1',
          maintenance_type: 'routine',
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
          status: 'scheduled',
          notes: 'Monthly LED inspection'
        },
        {
          id: '2', 
          fixture_id: 'fixture-2',
          maintenance_type: 'repair',
          scheduled_date: new Date(Date.now() + 172800000).toISOString(),
          completed_date: new Date().toISOString(),
          status: 'completed',
          vendor: 'ElectroFix Pro',
          cost: 150,
          notes: 'Replaced ballast'
        }
      ];
    }
  });

  // Fetch vendors
  const { data: vendors, isLoading: loadingVendors } = useQuery({
    queryKey: ['maintenance-vendors'],
    queryFn: async (): Promise<VendorInfo[]> => {
      // This would fetch from a vendors table
      // For now, return mock data
      return [
        {
          id: '1',
          name: 'ElectroFix Pro',
          contact_email: 'service@electrofix.com',
          contact_phone: '(555) 123-4567',
          specialties: ['LED Repair', 'Ballast Replacement', 'Emergency Lighting'],
          rating: 4.5,
          notes: 'Reliable contractor, good pricing'
        },
        {
          id: '2',
          name: 'Bright Solutions LLC',
          contact_email: 'info@brightsolutions.com',
          contact_phone: '(555) 987-6543',
          specialties: ['Fixture Installation', 'Maintenance Contracts'],
          rating: 4.2,
          notes: 'Great for bulk installations'
        }
      ];
    }
  });

  // Add vendor mutation
  const addVendorMutation = useMutation({
    mutationFn: async (vendor: Partial<VendorInfo>) => {
      // In real app, this would insert into vendors table
      console.log('Adding vendor:', vendor);
      return vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-vendors'] });
      setShowVendorForm(false);
      setNewVendor({ name: '', contact_email: '', contact_phone: '', specialties: [], notes: '' });
      toast.success('Vendor added successfully');
    },
    onError: () => {
      toast.error('Failed to add vendor');
    }
  });

  const handleAddVendor = () => {
    if (!newVendor.name) {
      toast.error('Vendor name is required');
      return;
    }
    addVendorMutation.mutate(newVendor);
  };

  const scheduledRecords = maintenanceRecords?.filter(r => r.status === 'scheduled') || [];
  const inProgressRecords = maintenanceRecords?.filter(r => r.status === 'in_progress') || [];
  const completedRecords = maintenanceRecords?.filter(r => r.status === 'completed') || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="text-sm font-medium">Scheduled</div>
            </div>
            <div className="text-2xl font-bold">{scheduledRecords.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div className="text-sm font-medium">In Progress</div>
            </div>
            <div className="text-2xl font-bold">{inProgressRecords.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-sm font-medium">Completed</div>
            </div>
            <div className="text-2xl font-bold">{completedRecords.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              <div className="text-sm font-medium">Vendors</div>
            </div>
            <div className="text-2xl font-bold">{vendors?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No scheduled maintenance. Great job keeping up!
                </p>
              ) : (
                <div className="space-y-4">
                  {scheduledRecords.map((record) => (
                    <MaintenanceCard key={record.id} record={record} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inProgressRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No maintenance currently in progress
                </p>
              ) : (
                <div className="space-y-4">
                  {inProgressRecords.map((record) => (
                    <MaintenanceCard key={record.id} record={record} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {completedRecords.map((record) => (
                  <MaintenanceCard key={record.id} record={record} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vendor Management
                </CardTitle>
                <Button onClick={() => setShowVendorForm(!showVendorForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showVendorForm && (
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Vendor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Vendor Name *"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newVendor.contact_email}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, contact_email: e.target.value }))}
                      />
                      <Input
                        placeholder="Phone"
                        value={newVendor.contact_phone}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, contact_phone: e.target.value }))}
                      />
                    </div>
                    <Textarea
                      placeholder="Notes about this vendor..."
                      value={newVendor.notes}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, notes: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddVendor} disabled={addVendorMutation.isPending}>
                        Add Vendor
                      </Button>
                      <Button variant="outline" onClick={() => setShowVendorForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {vendors?.map((vendor) => (
                <Card key={vendor.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {vendor.contact_email && <div>📧 {vendor.contact_email}</div>}
                          {vendor.contact_phone && <div>📞 {vendor.contact_phone}</div>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {vendor.specialties.map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        {vendor.notes && (
                          <p className="text-sm text-muted-foreground">{vendor.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {vendor.rating && (
                          <Badge variant="secondary">
                            ⭐ {vendor.rating}
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MaintenanceCardProps {
  record: MaintenanceRecord;
}

function MaintenanceCard({ record }: MaintenanceCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'routine':
        return <Calendar className="h-4 w-4" />;
      case 'preventive':
        return <CheckCircle className="h-4 w-4" />;
      case 'repair':
        return <Wrench className="h-4 w-4" />;
      case 'replacement':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getTypeIcon(record.maintenance_type)}
              <span className="font-medium capitalize">{record.maintenance_type} Maintenance</span>
              {getStatusBadge(record.status)}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Fixture ID: {record.fixture_id}
            </div>
            
            <div className="text-sm">
              <strong>Scheduled:</strong> {formatDate(record.scheduled_date)}
              {record.completed_date && (
                <span className="ml-4">
                  <strong>Completed:</strong> {formatDate(record.completed_date)}
                </span>
              )}
            </div>
            
            {record.vendor && (
              <div className="text-sm">
                <strong>Vendor:</strong> {record.vendor}
              </div>
            )}
            
            {record.cost && (
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="h-3 w-3" />
                <strong>Cost:</strong> ${record.cost}
              </div>
            )}
            
            {record.notes && (
              <div className="text-sm text-muted-foreground">
                {record.notes}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            {record.status === 'scheduled' && (
              <Button size="sm">
                Start Work
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}