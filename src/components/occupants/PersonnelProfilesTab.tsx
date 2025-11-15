import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Download, Upload, Users, UserCheck, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface PersonnelProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  primary_role: 'judge' | 'clerk' | 'sergeant' | 'officer' | 'administrator';
  title: string;
  department: string;
  phone: string;
  extension: string;
  fax: string;
  email: string;
  room_number: string;
  floor: string;
  building: string;
  is_active: boolean;
  is_available_for_assignment: boolean;
  notes: string;
  specializations: string[];
  created_at: string;
  updated_at: string;
}

export const PersonnelProfilesTab: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PersonnelProfile | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Form state for add/edit
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    primary_role: 'clerk' as PersonnelProfile['primary_role'],
    title: '',
    department: '',
    phone: '',
    extension: '',
    fax: '',
    email: '',
    room_number: '',
    floor: '',
    building: '',
    is_active: true,
    is_available_for_assignment: true,
    notes: '',
    specializations: [] as string[]
  });

  // Fetch all personnel profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['personnel-profiles'],
    queryFn: async () => {
      try {
        // Use RPC function for reliable data fetching
        const { data: personnelData, error: personnelError } = await supabase
          .rpc('list_personnel_profiles_minimal');
        
        if (personnelError) {
          console.error('Error fetching personnel via RPC:', personnelError);
          throw personnelError;
        }
        
        console.log('Personnel profiles loaded:', personnelData?.length || 0);
        
        const rows = (personnelData || []).map((r: any) => ({
          id: r.id,
          display_name: r.display_name || r.full_name || '',
          first_name: r.first_name || null,
          last_name: r.last_name || null,
          primary_role: r.primary_role || 'clerk',
          title: r.title || '',
          department: r.department || '',
          phone: r.phone || '',
          extension: r.extension || '',
          fax: r.fax || '',
          email: r.email || '',
          room_number: r.room_number || '',
          floor: r.floor || '',
          building: r.building || '',
          is_active: r.is_active ?? true,
          is_available_for_assignment: r.is_available ?? true,
          notes: r.notes || '',
          specializations: r.specializations || [],
          created_at: r.created_at || new Date().toISOString(),
          updated_at: r.updated_at || new Date().toISOString(),
        })) as PersonnelProfile[];
        
        return rows;
      } catch (error) {
        console.error('Error fetching personnel profiles:', error);
        return [] as PersonnelProfile[];
      }
    },
  });

  // Filter profiles based on role and search
  const filteredProfiles = (profiles || [])
    // Client-side sort to avoid server 500s on order
    .slice()
    .sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''))
    .filter(profile => {
    const matchesRole = selectedRole === 'all' || profile.primary_role === selectedRole;
    const matchesSearch = searchTerm === '' || 
      profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim().toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesSearch;
  }) || [];

  // Group profiles by role for stats
  const profileStats = profiles?.reduce((acc, profile) => {
    acc[profile.primary_role] = (acc[profile.primary_role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const activeProfiles = profiles?.filter(p => p.is_active).length || 0;
  const availableProfiles = profiles?.filter(p => p.is_available_for_assignment).length || 0;

  // Toggle profile status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('personnel_profiles')
        .update({ [field]: value })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['court-personnel'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  // Add personnel mutation
  const addPersonnelMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('personnel_profiles')
        .insert([{
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['court-personnel'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success('Personnel added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add personnel: ' + error.message);
    },
  });

  // Edit personnel mutation
  const editPersonnelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('personnel_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['court-personnel'] });
      setIsEditDialogOpen(false);
      setEditingProfile(null);
      resetForm();
      toast.success('Personnel updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update personnel: ' + error.message);
    },
  });

  // Import CSV mutation
  const importCSVMutation = useMutation({
    mutationFn: async (csvData: any[]) => {
      const { error } = await supabase
        .from('personnel_profiles')
        .insert(csvData.map(row => ({
          ...row,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));
      
      if (error) throw error;
      return csvData.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['court-personnel'] });
      setIsImporting(false);
      toast.success(`Successfully imported ${count} personnel records`);
    },
    onError: (error) => {
      setIsImporting(false);
      toast.error('Failed to import CSV: ' + error.message);
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      display_name: '',
      primary_role: 'clerk',
      title: '',
      department: '',
      phone: '',
      extension: '',
      fax: '',
      email: '',
      room_number: '',
      floor: '',
      building: '',
      is_active: true,
      is_available_for_assignment: true,
      notes: '',
      specializations: []
    });
  };

  const openEditDialog = (profile: PersonnelProfile) => {
    setEditingProfile(profile);
    setFormData({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      display_name: profile.display_name || '',
      primary_role: profile.primary_role,
      title: profile.title || '',
      department: profile.department || '',
      phone: profile.phone || '',
      extension: profile.extension || '',
      fax: profile.fax || '',
      email: profile.email || '',
      room_number: profile.room_number || '',
      floor: profile.floor || '',
      building: profile.building || '',
      is_active: profile.is_active,
      is_available_for_assignment: profile.is_available_for_assignment,
      notes: profile.notes || '',
      specializations: profile.specializations || []
    });
    setIsEditDialogOpen(true);
  };

  // Export to CSV (integrates with existing export system)
  const exportToCSV = () => {
    if (!profiles) return;

    const headers = [
      'Display Name', 'First Name', 'Last Name', 'Role', 'Title', 'Department',
      'Phone', 'Extension', 'Fax', 'Email', 'Room', 'Floor', 'Building',
      'Active', 'Available', 'Notes'
    ];

    const csvContent = [
      headers.join(','),
      ...profiles.map(profile => [
        profile.display_name,
        profile.first_name,
        profile.last_name,
        profile.primary_role,
        profile.title || '',
        profile.department || '',
        profile.phone || '',
        profile.extension || '',
        profile.fax || '',
        profile.email || '',
        profile.room_number || '',
        profile.floor || '',
        profile.building || '',
        profile.is_active ? 'Yes' : 'No',
        profile.is_available_for_assignment ? 'Yes' : 'No',
        profile.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personnel-profiles-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Personnel profiles exported to CSV');
  };

  // Import CSV functionality
  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('CSV file must contain at least a header row and one data row');
          setIsImporting(false);
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const row: any = {};

          headers.forEach((header, index) => {
            const value = values[index] || '';
            switch (header.toLowerCase()) {
              case 'display name':
                row.display_name = value;
                break;
              case 'first name':
                row.first_name = value;
                break;
              case 'last name':
                row.last_name = value;
                break;
              case 'role':
                row.primary_role = value.toLowerCase();
                break;
              case 'title':
                row.title = value;
                break;
              case 'department':
                row.department = value;
                break;
              case 'phone':
                row.phone = value;
                break;
              case 'extension':
                row.extension = value;
                break;
              case 'fax':
                row.fax = value;
                break;
              case 'email':
                row.email = value;
                break;
              case 'room':
                row.room_number = value;
                break;
              case 'floor':
                row.floor = value;
                break;
              case 'building':
                row.building = value;
                break;
              case 'active':
                row.is_active = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
                break;
              case 'available':
                row.is_available_for_assignment = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
                break;
              case 'notes':
                row.notes = value;
                break;
            }
          });

          // Validate required fields
          if (!row.display_name && !row.first_name && !row.last_name) {
            toast.error(`Row ${i + 1}: Missing required name information`);
            setIsImporting(false);
            return;
          }

          // Set defaults
          row.display_name = row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim();
          row.primary_role = row.primary_role || 'clerk';
          row.is_active = row.is_active !== undefined ? row.is_active : true;
          row.is_available_for_assignment = row.is_available_for_assignment !== undefined ? row.is_available_for_assignment : true;
          row.specializations = [];

          data.push(row);
        }

        importCSVMutation.mutate(data);
      } catch (error) {
        toast.error('Failed to parse CSV file: ' + error.message);
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read CSV file');
      setIsImporting(false);
    };

    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.display_name && !formData.first_name && !formData.last_name) {
      toast.error('Please provide at least a display name or first/last name');
      return;
    }

    // Auto-generate display name if not provided
    const finalFormData = {
      ...formData,
      display_name: formData.display_name || `${formData.first_name} ${formData.last_name}`.trim()
    };

    if (editingProfile) {
      editPersonnelMutation.mutate({ id: editingProfile.id, data: finalFormData });
    } else {
      addPersonnelMutation.mutate(finalFormData);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'judge': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'clerk': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sergeant': return 'bg-green-100 text-green-800 border-green-200';
      case 'officer': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading personnel profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Court Personnel Profiles</h3>
          <p className="text-gray-600">Manage court personnel for dropdown assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={handleImportCSV} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button 
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Personnel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{profiles?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold">{availableProfiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-purple-600 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-600">Judges</p>
                <p className="text-2xl font-bold">{profileStats.judge || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-blue-600 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-600">Clerks</p>
                <p className="text-2xl font-bold">{profileStats.clerk || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-green-600 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-600">Sergeants</p>
                <p className="text-2xl font-bold">{profileStats.sergeant || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="judge">Judges</SelectItem>
            <SelectItem value="clerk">Clerks</SelectItem>
            <SelectItem value="sergeant">Sergeants</SelectItem>
            <SelectItem value="officer">Officers</SelectItem>
            <SelectItem value="administrator">Administrators</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{profile.display_name}</CardTitle>
                  <CardDescription>{`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}</CardDescription>
                </div>
                <Badge className={getRoleBadgeColor(profile.primary_role)}>
                  {profile.primary_role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                {profile.title && (
                  <p><span className="font-medium">Title:</span> {profile.title}</p>
                )}
                {profile.department && (
                  <p><span className="font-medium">Department:</span> {profile.department}</p>
                )}
                {profile.phone && (
                  <p><span className="font-medium">Phone:</span> {profile.phone}</p>
                )}
                {profile.room_number && (
                  <p><span className="font-medium">Room:</span> {profile.room_number}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profile.is_active}
                      onCheckedChange={(checked) => 
                        toggleStatusMutation.mutate({
                          id: profile.id,
                          field: 'is_active',
                          value: checked
                        })
                      }
                    />
                    <span className="text-xs text-gray-600">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profile.is_available_for_assignment}
                      onCheckedChange={(checked) => 
                        toggleStatusMutation.mutate({
                          id: profile.id,
                          field: 'is_available_for_assignment',
                          value: checked
                        })
                      }
                    />
                    <span className="text-xs text-gray-600">Available</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => openEditDialog(profile)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No personnel profiles found matching your criteria.</p>
        </div>
      )}

      {/* Add Personnel Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Personnel</DialogTitle>
            <DialogDescription>
              Add a new court personnel member to the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Enter display name (auto-generated if empty)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_role">Role</Label>
                <Select 
                  value={formData.primary_role} 
                  onValueChange={(value) => setFormData({ ...formData, primary_role: value as PersonnelProfile['primary_role'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="clerk">Clerk</SelectItem>
                    <SelectItem value="sergeant">Sergeant</SelectItem>
                    <SelectItem value="officer">Officer</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter job title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extension">Extension</Label>
                <Input
                  id="extension"
                  value={formData.extension}
                  onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                  placeholder="Enter extension"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  placeholder="Enter fax number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="Enter room number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="Enter floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="Enter building"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_available_for_assignment"
                  checked={formData.is_available_for_assignment}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available_for_assignment: checked })}
                />
                <Label htmlFor="is_available_for_assignment">Available for Assignment</Label>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addPersonnelMutation.isPending}
              >
                {addPersonnelMutation.isPending ? 'Adding...' : 'Add Personnel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Personnel Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Personnel</DialogTitle>
            <DialogDescription>
              Update the information for {editingProfile?.display_name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_display_name">Display Name</Label>
              <Input
                id="edit_display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Enter display name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_primary_role">Role</Label>
                <Select 
                  value={formData.primary_role} 
                  onValueChange={(value) => setFormData({ ...formData, primary_role: value as PersonnelProfile['primary_role'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="clerk">Clerk</SelectItem>
                    <SelectItem value="sergeant">Sergeant</SelectItem>
                    <SelectItem value="officer">Officer</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter job title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_department">Department</Label>
              <Input
                id="edit_department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_extension">Extension</Label>
                <Input
                  id="edit_extension"
                  value={formData.extension}
                  onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                  placeholder="Enter extension"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_fax">Fax</Label>
                <Input
                  id="edit_fax"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  placeholder="Enter fax number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_room_number">Room Number</Label>
                <Input
                  id="edit_room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="Enter room number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_floor">Floor</Label>
                <Input
                  id="edit_floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="Enter floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_building">Building</Label>
                <Input
                  id="edit_building"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="Enter building"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit_is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit_is_available_for_assignment"
                  checked={formData.is_available_for_assignment}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available_for_assignment: checked })}
                />
                <Label htmlFor="edit_is_available_for_assignment">Available for Assignment</Label>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingProfile(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editPersonnelMutation.isPending}
              >
                {editPersonnelMutation.isPending ? 'Updating...' : 'Update Personnel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
