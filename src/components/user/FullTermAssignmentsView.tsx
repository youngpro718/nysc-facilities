import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Gavel, 
  User, 
  Shield, 
  Phone, 
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CourtAssignment {
  id: string;
  room_id: string;
  part: string | null;
  sort_order: number | null;
  justice_id: string | null;
  clerk_id: string | null;
  sergeant_id: string | null;
  phone_number: string | null;
  fax_number: string | null;
  calendar_days: string | null;
  tel: string | null;
  court_rooms: {
    room_number: string;
    floor: string;
  };
  justice: {
    id: string;
    display_name: string;
    title: string;
    phone: string | null;
    extension: string | null;
    room_number: string | null;
  } | null;
  clerk: {
    id: string;
    display_name: string;
    title: string;
    phone: string | null;
    extension: string | null;
    room_number: string | null;
  } | null;
  sergeant: {
    id: string;
    display_name: string;
    title: string;
    phone: string | null;
    extension: string | null;
    room_number: string | null;
  } | null;
}

interface FullTermAssignmentsViewProps {
  userId?: string;
  userRole?: 'justice' | 'clerk' | 'sergeant' | null;
  userPersonnelId?: string;
}

export function FullTermAssignmentsView({ 
  userId, 
  userRole,
  userPersonnelId 
}: FullTermAssignmentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Fetch court assignments with pagination/limiting for better performance
  const { data: assignments = [], isLoading, error: queryError } = useQuery({
    queryKey: ['full-term-assignments'],
    queryFn: async () => {
      const startTime = performance.now();
      console.log('🔄 Starting court assignments query...');
      // Try query with join first - IMPORTANT: Include sort_order for proper ordering
      let { data, error } = await supabase
        .from('court_assignments')
        .select(`
          *,
          court_rooms(room_number, floor)
        `)
        .not('part', 'is', null)
        .not('part', 'eq', '');

      // If join fails, try without join
      if (error) {
        console.warn('Query with join failed, trying without join:', error);
        const simpleQuery = await supabase
          .from('court_assignments')
          .select('*')
          .not('part', 'is', null)
          .not('part', 'eq', '');
        
        data = simpleQuery.data;
        error = simpleQuery.error;
      }

      if (error) {
        console.error('Court assignments query error:', error);
        throw new Error(`Database error: ${error.message || 'Unknown error'}`);
      }
      
      console.log('Court assignments data:', data, 'Count:', data?.length);
      
      // Transform the data to match our interface
      const transformed = (data || []).map((item: any) => ({
        ...item,
        court_rooms: item.court_rooms?.[0] || item.court_rooms || { 
          room_number: item.room_number || 'Unknown', 
          floor: item.floor || 'Unknown' 
        },
        // Map text fields to expected structure
        justice: item.justice ? {
          id: item.justice_id || '',
          display_name: item.justice,
          title: 'Justice',
          phone: item.tel || null,
          extension: null,
          room_number: null
        } : null,
        clerk: item.clerks ? {
          id: item.clerk_id || '',
          display_name: Array.isArray(item.clerks) ? item.clerks.join(', ') : item.clerks,
          title: 'Court Clerk',
          phone: null,
          extension: null,
          room_number: null
        } : null,
        sergeant: item.sergeant ? {
          id: item.sergeant_id || '',
          display_name: item.sergeant,
          title: 'Court Sergeant',
          phone: null,
          extension: null,
          room_number: null
        } : null
      })) as CourtAssignment[];
      
      // Sort by sort_order (same as admin view), fallback to room_number
      const sorted = transformed.sort((a, b) => {
        const aOrder = a.sort_order || 0;
        const bOrder = b.sort_order || 0;
        
        // If both have sort_order, use that
        if (aOrder > 0 && bOrder > 0) {
          return aOrder - bOrder;
        }
        
        // Otherwise sort by room number
        const aRoom = a.court_rooms?.room_number || '';
        const bRoom = b.court_rooms?.room_number || '';
        return aRoom.localeCompare(bRoom);
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`✅ Court assignments loaded: ${sorted.length} records in ${loadTime.toFixed(2)}ms`);
      console.log('First 5 assignments:', sorted.slice(0, 5).map(a => ({ 
        part: a.part, 
        sort_order: a.sort_order, 
        room: a.court_rooms?.room_number
      })));
      
      // Log Part 37 specifically if it exists
      const part37 = sorted.find(a => a.part === '37');
      if (part37) {
        console.log('Part 37:', {
          part: part37.part,
          room: part37.court_rooms?.room_number,
          floor: part37.court_rooms?.floor,
          justice: part37.justice?.display_name
        });
      }
      
      return sorted;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Log any query errors
  if (queryError) {
    console.error('Query error:', queryError);
  }

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.part?.toLowerCase().includes(searchLower) ||
      assignment.court_rooms?.room_number?.toLowerCase().includes(searchLower) ||
      assignment.court_rooms?.floor?.toLowerCase().includes(searchLower) ||
      assignment.justice?.display_name?.toLowerCase().includes(searchLower) ||
      assignment.clerk?.display_name?.toLowerCase().includes(searchLower) ||
      assignment.sergeant?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  // Check if this assignment belongs to the current user
  const isUserAssignment = (assignment: CourtAssignment): boolean => {
    if (!userPersonnelId) return false;
    
    switch (userRole) {
      case 'justice':
        return assignment.justice_id === userPersonnelId;
      case 'clerk':
        return assignment.clerk_id === userPersonnelId;
      case 'sergeant':
        return assignment.sergeant_id === userPersonnelId;
      default:
        return false;
    }
  };

  const toggleExpand = (roomId: string) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Current Term Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading courtroom assignments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (queryError) {
    const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Current Term Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-muted-foreground mb-2">Error loading assignments</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-2xl mx-auto">
              <p className="text-xs text-red-800 font-mono break-all">{errorMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 min-w-0 flex-1">
            <Gavel className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-base sm:text-lg font-semibold truncate">Term Assignments</div>
              <div className="text-xs font-normal text-muted-foreground">
                {filteredAssignments.length} {filteredAssignments.length === 1 ? 'part' : 'parts'}
              </div>
            </div>
          </CardTitle>
        </div>
        
        {/* Search Bar - Mobile Optimized */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search part, room, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 text-sm h-9 sm:h-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 py-3">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No parts match your search' : 'Loading term assignments...'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssignments.map((assignment) => {
              const isExpanded = expandedRoom === assignment.room_id;
              const isMyAssignment = isUserAssignment(assignment);

              return (
                <div
                  key={assignment.id}
                  className={`
                    border rounded-lg transition-all touch-manipulation
                    ${isMyAssignment 
                      ? 'border-primary bg-primary/5 ring-1 sm:ring-2 ring-primary/20' 
                      : 'border-border active:border-primary/50'
                    }
                  `}
                >
                  {/* Courtroom Header - Mobile Optimized */}
                  <div
                    className="p-2 sm:p-3 cursor-pointer active:bg-accent/70 transition-colors"
                    onClick={() => toggleExpand(assignment.room_id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base">
                            {assignment.part ? `Part ${assignment.part}` : 'Unassigned'} - {assignment.court_rooms?.floor && assignment.court_rooms.floor !== 'Unknown' ? `Floor ${assignment.court_rooms.floor}, ` : ''}Room {assignment.court_rooms?.room_number || 'Unknown'}
                          </h3>
                          {isMyAssignment && (
                            <Badge className="bg-primary/20 text-primary border-primary text-xs flex-shrink-0">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Yours
                            </Badge>
                          )}
                        </div>

                        {/* Quick Personnel Summary - Mobile Optimized */}
                        <div className="grid grid-cols-1 gap-0.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Gavel className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">
                              {assignment.justice?.display_name || 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">
                              {assignment.clerk?.display_name || 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">
                              {assignment.sergeant?.display_name || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" className="flex-shrink-0 p-1 sm:p-2 touch-manipulation">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
                      {/* Justice Details */}
                      {assignment.justice && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Gavel className="h-4 w-4 text-primary" />
                            Justice
                          </div>
                          <div className="ml-6 space-y-1 text-sm">
                            <div className="font-medium">{assignment.justice.display_name}</div>
                            <div className="text-muted-foreground">{assignment.justice.title}</div>
                            {assignment.justice.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {assignment.justice.phone}
                                {assignment.justice.extension && ` ext. ${assignment.justice.extension}`}
                              </div>
                            )}
                            {assignment.justice.room_number && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                Room {assignment.justice.room_number}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Clerk Details */}
                      {assignment.clerk && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <User className="h-4 w-4 text-primary" />
                            Court Clerk
                          </div>
                          <div className="ml-6 space-y-1 text-sm">
                            <div className="font-medium">{assignment.clerk.display_name}</div>
                            <div className="text-muted-foreground">{assignment.clerk.title}</div>
                            {assignment.clerk.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {assignment.clerk.phone}
                                {assignment.clerk.extension && ` ext. ${assignment.clerk.extension}`}
                              </div>
                            )}
                            {assignment.clerk.room_number && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                Room {assignment.clerk.room_number}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sergeant Details */}
                      {assignment.sergeant && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Shield className="h-4 w-4 text-primary" />
                            Court Sergeant
                          </div>
                          <div className="ml-6 space-y-1 text-sm">
                            <div className="font-medium">{assignment.sergeant.display_name}</div>
                            <div className="text-muted-foreground">{assignment.sergeant.title}</div>
                            {assignment.sergeant.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {assignment.sergeant.phone}
                                {assignment.sergeant.extension && ` ext. ${assignment.sergeant.extension}`}
                              </div>
                            )}
                            {assignment.sergeant.room_number && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                Room {assignment.sergeant.room_number}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Courtroom Contact Info */}
                      {(assignment.phone_number || assignment.fax_number || assignment.calendar_days) && (
                        <div className="pt-3 border-t space-y-2">
                          <div className="text-sm font-semibold">Courtroom Information</div>
                          <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                            {assignment.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                Phone: {assignment.phone_number}
                              </div>
                            )}
                            {assignment.fax_number && (
                              <div>Fax: {assignment.fax_number}</div>
                            )}
                            {assignment.calendar_days && (
                              <div>Calendar Days: {assignment.calendar_days}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
