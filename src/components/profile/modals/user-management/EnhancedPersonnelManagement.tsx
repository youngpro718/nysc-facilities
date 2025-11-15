// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Mail, 
  Crown, 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus,
  Search,
  Filter,
  Phone,
  MapPin,
  Building,
  Briefcase
} from "lucide-react";
import { useUnifiedPersonnel, type UnifiedPersonnel } from '@/hooks/useUnifiedPersonnel';

interface PersonnelCardProps {
  person: UnifiedPersonnel;
  currentUserId: string | null;
  onAssignRole: (personnelId: string, role: string) => void;
  onPromoteToAdmin: (userId: string) => void;
  onInvitePersonnel: (personnelId: string, email: string) => void;
  isUpdating: boolean;
}

function PersonnelCard({ 
  person, 
  currentUserId, 
  onAssignRole,
  onPromoteToAdmin,
  onInvitePersonnel,
  isUpdating 
}: PersonnelCardProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(person.email || '');

  const getPersonnelBadge = (person: UnifiedPersonnel) => {
    switch (person.personnel_type) {
      case 'court_personnel': return 'bg-purple-100 text-purple-800';
      case 'occupant': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelColor = (level?: string) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'write': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canPromoteToAdmin = person.personnel_type === 'occupant' && person.access_level !== 'admin';
  const canAssignRole = true; 
  const isRegistered = person.personnel_type === 'occupant' && person.status === 'active';
  const isCurrentUser = false; // TODO: Implement current user detection

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{person.display_name}</CardTitle>
              <Badge className={getPersonnelBadge(person)}>
                {person.personnel_type.replace('_', ' ')}
              </Badge>
              {person.access_level && (
                <Badge className={getAccessLevelColor(person.access_level)}>
                  {person.access_level}
                </Badge>
              )}
              {person.personnel_type === 'occupant' ? (
                person.status === 'pending' ? (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                ) : person.status === 'active' ? (
                  <Badge className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    Inactive
                  </Badge>
                )
              ) : person.personnel_type === 'court_personnel' && (
                <Badge className="bg-green-100 text-green-800">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              {person.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {person.email}
                </div>
              )}
              {person.department && (
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {person.department}
                </div>
              )}
              {person.title && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {person.title}
                </div>
              )}
              {person.role && person.role !== person.title && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {person.role}
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {person.phone} {person.extension && `ext. ${person.extension}`}
                </div>
              )}
              {person.room && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Room {person.room} {person.floor && `(Floor ${person.floor})`}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canAssignRole && (
            <Select onValueChange={(role) => onAssignRole(person.id, role)}>
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Assign Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="judge">Judge</SelectItem>
                <SelectItem value="court_aide">Court Aide</SelectItem>
                <SelectItem value="clerk">Clerk</SelectItem>
                <SelectItem value="sergeant">Sergeant</SelectItem>
                <SelectItem value="court_officer">Court Officer</SelectItem>
                <SelectItem value="bailiff">Bailiff</SelectItem>
                <SelectItem value="court_reporter">Court Reporter</SelectItem>
                <SelectItem value="administrative_assistant">Administrative Assistant</SelectItem>
                <SelectItem value="facilities_manager">Facilities Manager</SelectItem>
                <SelectItem value="supply_room_staff">Supply Room Staff</SelectItem>
              </SelectContent>
            </Select>
          )}

          {canPromoteToAdmin && person.user_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPromoteToAdmin(person.source_id)}
              disabled={false}
              className="gap-1"
            >
              <Crown className="h-3 w-3" />
              Make Admin
            </Button>
          )}

          {person.personnel_type === 'court_personnel' && (
            <>
              {!showInviteForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteForm(true)}
                  className="gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Invite
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      onInvitePersonnel(person.id, inviteEmail);
                      setShowInviteForm(false);
                    }}
                    disabled={!inviteEmail || isUpdating}
                  >
                    Send
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EnhancedPersonnelManagement() {
  const {
    personnel: allPersonnel,
    stats: personnelStats,
    isLoading,
    error,
    searchPersonnel,
    getPersonnelByType
  } = useUnifiedPersonnel();

  // TODO: Add role assignment and invitation functionality
  const isAssigningRole = false;
  const isInviting = false;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'registered' | 'unregistered' | 'court' | 'occupants'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  const isUpdating = isAssigningRole || isInviting;

  // Filter personnel based on search and filters
  const filteredPersonnel = allPersonnel.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' ||
                       (filterType === 'registered' && person.is_registered) ||
                       (filterType === 'unregistered' && !person.is_registered) ||
                       (filterType === 'court' && person.personnel_type === 'court_personnel') ||
                       (filterType === 'occupants' && person.personnel_type === 'occupant');

    const matchesRole = filterRole === 'all' ||
                       person.role === filterRole ||
                       person.access_level === filterRole;

    return matchesSearch && matchesType && matchesRole;
  });

  if (isLoading) {
    return <div className="p-4">Loading personnel...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Personnel</p>
                <p className="text-2xl font-bold">{personnelStats.totalPersonnel}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered Users</p>
                <p className="text-2xl font-bold">{personnelStats.registeredUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Court Personnel</p>
                <p className="text-2xl font-bold">{personnelStats.courtPersonnel}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unassigned Roles</p>
                <p className="text-2xl font-bold">{personnelStats.unassignedRoles}</p>
              </div>
              <UserX className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personnel by name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Personnel</SelectItem>
            <SelectItem value="registered">Registered Users</SelectItem>
            <SelectItem value="unregistered">Unregistered</SelectItem>
            <SelectItem value="court">Court Personnel</SelectItem>
            <SelectItem value="occupants">Occupants</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="judge">Judge</SelectItem>
            <SelectItem value="clerk">Clerk</SelectItem>
            <SelectItem value="sergeant">Sergeant</SelectItem>
            <SelectItem value="court_officer">Court Officer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Personnel List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Personnel ({filteredPersonnel.length})
          </h3>
        </div>

        <div className="grid gap-4">
          {filteredPersonnel.map((person) => (
            <PersonnelCard
              key={person.id}
              person={person}
              currentUserId={currentUserId}
              onAssignRole={(personnelId, role) => assignRole({ personnelId, role })}
              onPromoteToAdmin={promoteToAdmin}
              onInvitePersonnel={(personnelId, email) => invitePersonnel({ personnelId, email })}
              isUpdating={isUpdating}
            />
          ))}
        </div>

        {filteredPersonnel.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No personnel found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
