import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUnifiedPersonnelView } from '@/hooks/useUnifiedPersonnelView';
import { Users, Search, Phone, Mail, MapPin, UserCheck } from 'lucide-react';

export function UnifiedPersonnelDisplay() {
  const { personnel, stats, isLoading, error } = useUnifiedPersonnelView();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'registered_user' | 'court_personnel'>('all');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading personnel...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading personnel: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter personnel based on search and type
  const filteredPersonnel = personnel.filter(person => {
    const matchesType = filterType === 'all' || person.personnel_type === filterType;
    const matchesSearch = !searchTerm || 
      person.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const getPersonnelTypeBadge = (type: string) => {
    switch (type) {
      case 'registered_user':
        return <Badge className="bg-blue-100 text-blue-800">Registered User</Badge>;
      case 'court_personnel':
        return <Badge className="bg-purple-100 text-purple-800">Court Personnel</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Personnel</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.registeredUsers}</div>
                <div className="text-sm text-gray-600">Registered Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.courtPersonnel}</div>
                <div className="text-sm text-gray-600">Court Personnel</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>All Personnel</CardTitle>
          <CardDescription>
            Unified view of all registered users and court personnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search personnel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                All ({stats.total})
              </Button>
              <Button
                variant={filterType === 'registered_user' ? 'default' : 'outline'}
                onClick={() => setFilterType('registered_user')}
                size="sm"
              >
                Users ({stats.registeredUsers})
              </Button>
              <Button
                variant={filterType === 'court_personnel' ? 'default' : 'outline'}
                onClick={() => setFilterType('court_personnel')}
                size="sm"
              >
                Court ({stats.courtPersonnel})
              </Button>
            </div>
          </div>

          {/* Personnel List */}
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {filteredPersonnel.map((person) => (
              <div key={person.unified_id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{person.full_name}</h3>
                    <p className="text-sm text-gray-600">{person.role}</p>
                  </div>
                  {getPersonnelTypeBadge(person.personnel_type)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  {person.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {person.email}
                    </div>
                  )}
                  {person.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {person.phone}
                    </div>
                  )}
                  {person.department && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {person.department}
                    </div>
                  )}
                  {person.room && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Room {person.room}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {filteredPersonnel.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No personnel found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
