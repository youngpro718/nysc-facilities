// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Download, Upload, Users, UserCheck, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PersonnelProfile {
  id: string;
  first_name: string;
  last_name: string;
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
  const queryClient = useQueryClient();

  // Fetch all personnel profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['personnel-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personnel_profiles')
        .select('*')
        .order('primary_role')
        .order('last_name');
      
      if (error) throw error;
      return data as PersonnelProfile[];
    },
  });

  // Filter profiles based on role and search
  const filteredProfiles = profiles?.filter(profile => {
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
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
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
                      size="sm"
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
                      size="sm"
                    />
                    <span className="text-xs text-gray-600">Available</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
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
    </div>
  );
};
