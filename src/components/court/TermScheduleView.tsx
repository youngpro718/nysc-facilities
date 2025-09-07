import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Phone, Users, FileText, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface TermAssignment {
  id: string;
  part_id: string;
  room_id: string | null;
  justice_name: string;
  clerk_names: string[] | null;
  sergeant_name: string | null;
  phone: string | null;
  fax: string | null;
  tel_extension: string | null;
  court_parts: {
    part_code: string;
    description: string | null;
  };
  rooms: {
    room_number: string;
    name: string;
  } | null;
}

interface TermScheduleViewProps {
  termId: string;
}

export const TermScheduleView = ({ termId }: TermScheduleViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const { data: termAssignments, isLoading } = useQuery({
    queryKey: ['term-assignments', termId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('term_assignments')
        .select(`
          *,
          court_parts(part_code, description),
          rooms(room_number, name)
        `)
        .eq('term_id', termId)
        .order('court_parts(part_code)');

      if (error) throw error;
      return data as any[];
    },
  });

  const { data: termInfo } = useQuery({
    queryKey: ['term-info', termId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_terms')
        .select('*')
        .eq('id', termId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const filteredAssignments = useMemo(() => {
    if (!termAssignments) return [];

    return termAssignments.filter(assignment => {
      const matchesSearch = 
        assignment.justice_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.court_parts.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.rooms?.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.clerk_names?.some(clerk => 
          clerk.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesLocation = locationFilter === 'all' || 
        (locationFilter === '100-centre' && termInfo?.location?.includes('100 Centre')) ||
        (locationFilter === '111-centre' && termInfo?.location?.includes('111 Centre'));

      return matchesSearch && matchesLocation;
    });
  }, [termAssignments, searchTerm, locationFilter, termInfo]);

  const groupedAssignments = useMemo(() => {
    const groups: { [key: string]: TermAssignment[] } = {};
    
    filteredAssignments.forEach(assignment => {
      const location = termInfo?.location?.includes('100 Centre') ? '100 Centre Street' : '111 Centre Street';
      if (!groups[location]) groups[location] = [];
      groups[location].push(assignment);
    });

    return groups;
  }, [filteredAssignments, termInfo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Term Header */}
      {termInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {termInfo.term_name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Term #{termInfo.term_number}</span>
              <span>•</span>
              <span>{termInfo.location}</span>
              <span>•</span>
              <span>{new Date(termInfo.start_date).toLocaleDateString()} - {new Date(termInfo.end_date).toLocaleDateString()}</span>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by justice name, part, room, or clerk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="100-centre">100 Centre Street</SelectItem>
            <SelectItem value="111-centre">111 Centre Street</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="whitespace-nowrap">
          {filteredAssignments.length} assignments
        </Badge>
      </div>

      {/* Assignment Groups */}
      {Object.entries(groupedAssignments).map(([location, assignments]) => (
        <div key={location} className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <h3 className="font-semibold text-lg">{location}</h3>
            <Badge variant="outline">{assignments.length} courtrooms</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="font-mono">
                      Part {assignment.court_parts.part_code}
                    </Badge>
                    {assignment.rooms && (
                      <Badge variant="outline" className="text-xs">
                        Room {assignment.rooms.room_number}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {assignment.justice_name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {assignment.clerk_names && assignment.clerk_names.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Clerks</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {assignment.clerk_names.map((clerk, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {clerk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.sergeant_name && (
                    <div className="text-sm">
                      <span className="font-medium">Sergeant: </span>
                      <span>{assignment.sergeant_name}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {assignment.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs">{assignment.phone}</span>
                      </div>
                    )}

                    {assignment.tel_extension && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs">Ext. {assignment.tel_extension}</span>
                      </div>
                    )}

                    {assignment.fax && (
                      <div className="flex items-center gap-1 col-span-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs">Fax: {assignment.fax}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filteredAssignments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No assignments found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};