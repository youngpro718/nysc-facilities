/**
 * TermSheetPreview - Compact court term sheet viewer for user dashboard
 * 
 * Shows a searchable, collapsible preview of court assignments with:
 * - Part, Justice, Room, and Extension
 * - Search/filter capability
 * - Link to full term sheet page
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Scale, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Phone,
  MapPin,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TermAssignment {
  part: string;
  justice: string;
  room: string;
  tel: string;
  clerks: string[];
}

interface TermSheetPreviewProps {
  maxItems?: number;
  defaultExpanded?: boolean;
  className?: string;
}

export function TermSheetPreview({ 
  maxItems = 8, 
  defaultExpanded = false,
  className 
}: TermSheetPreviewProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch term assignments (reusing same query as TermSheetBoard)
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['term-sheet-preview'],
    queryFn: async () => {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("*")
        .order("sort_order");

      if (assignmentsError) throw assignmentsError;

      const { data: roomsData, error: roomsError } = await supabase
        .from("court_rooms")
        .select(`id, room_id, room_number, courtroom_number, is_active`);

      if (roomsError) throw roomsError;

      const roomMap = new Map();
      (roomsData || []).forEach((room: Record<string, unknown>) => {
        roomMap.set(room.room_id, room);
      });

      const combined = (assignmentsData || [])
        .map((assignment: Record<string, unknown>) => {
          const room = roomMap.get(assignment.room_id);
          if (!room) return null;
          
          return {
            room_number: room.room_number || room.courtroom_number || '—',
            part: assignment?.part || '—',
            justice: assignment?.justice || '—',
            tel: assignment?.tel || '—',
            clerks: assignment?.clerks || [],
            is_active: room.is_active,
          };
        })
        .filter((row: Record<string, unknown>) => row !== null && row.is_active);

      return combined.map((row: Record<string, unknown>): TermAssignment => ({
        part: row.part,
        justice: row.justice,
        room: row.room_number,
        tel: row.tel,
        clerks: Array.isArray(row.clerks) ? row.clerks : [],
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(a => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.part.toLowerCase().includes(query) ||
      a.justice.toLowerCase().includes(query) ||
      a.room.toLowerCase().includes(query) ||
      a.tel.includes(query) ||
      a.clerks.some(c => c.toLowerCase().includes(query))
    );
  });

  const displayedAssignments = isExpanded 
    ? filteredAssignments 
    : filteredAssignments.slice(0, maxItems);

  const hasMore = filteredAssignments.length > maxItems;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-primary" />
            Court Term Sheet
            <Badge variant="secondary" className="text-xs">
              {assignments.length} Parts
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/term-sheet')}
          >
            View Full
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by part, justice, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {searchQuery ? 'No matching assignments found' : 'No term assignments available'}
          </div>
        ) : (
          <>
            {/* Mobile: Card-based view */}
            <div className="sm:hidden space-y-2">
              {displayedAssignments.map((assignment, index) => (
                <div
                  key={`${assignment.part}-${index}`}
                  className="border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="default" className="font-semibold">
                      {assignment.part}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Rm {assignment.room}
                    </span>
                  </div>
                  <div className="text-sm font-medium flex items-center gap-1.5 mb-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {assignment.justice}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {assignment.tel}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden sm:block">
              <ScrollArea className={isExpanded && filteredAssignments.length > 10 ? "h-[400px]" : undefined}>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Part</th>
                      <th className="text-left py-2 px-3 font-medium">Justice</th>
                      <th className="text-left py-2 px-3 font-medium">Room</th>
                      <th className="text-left py-2 px-3 font-medium">Extension</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAssignments.map((assignment, index) => (
                      <tr
                        key={`${assignment.part}-${index}`}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2 px-3 font-semibold text-primary">
                          {assignment.part}
                        </td>
                        <td className="py-2 px-3">{assignment.justice}</td>
                        <td className="py-2 px-3 text-muted-foreground">{assignment.room}</td>
                        <td className="py-2 px-3 text-muted-foreground tabular-nums">{assignment.tel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>

            {/* Expand/Collapse button */}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-xs"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show {filteredAssignments.length - maxItems} More
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
