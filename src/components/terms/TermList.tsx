import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Search, 
  MoreVertical, 
  FileText, 
  Pencil, 
  Trash2, 
  Eye, 
  Download,
  User,
  Users,
  MapPin,
  CalendarDays,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { EditTermAssignmentDialog } from "@/components/terms/EditTermAssignmentDialog";

export function TermList() {
  const navigate = useNavigate();
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [viewMode, setViewMode<"terms" | "details" | "personnel">("terms");
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('court_terms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Get assignment counts for each term
        const termsWithCounts = await Promise.all(
          data.map(async (term) => {
            const { count: assignmentCount, error: assignmentError } = await supabase
              .from('term_assignments')
              .select('*', { count: 'exact', head: true })
              .eq('term_id', term.id);
              
            const { count: personnelCount, error: personnelError } = await supabase
              .from('term_personnel')
              .select('*', { count: 'exact', head: true })
              .eq('term_id', term.id);
              
            return {
              ...term,
              assignmentCount: assignmentCount || 0,
              personnelCount: personnelCount || 0
            };
          })
        );
        
        setTerms(termsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
      toast.error("Failed to load court terms");
    } finally {
      setLoading(false);
    }
  };

  const fetchTermDetails = async (termId: string) => {
    try {
      setLoading(true);
      
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('term_assignments')
        .select(`
          *,
          court_parts (
            part_code, 
            description
          ),
          rooms (
            name, 
            room_number, 
            floor_id,
            floors (
              name,
              building_id,
              buildings (
                name
              )
            )
          )
        `)
        .eq('term_id', termId);
        
      if (assignmentsError) {
        throw assignmentsError;
      }
      
      // Fetch personnel
      const { data: personnelData, error: personnelError } = await supabase
        .from('term_personnel')
        .select('*')
        .eq('term_id', termId);
        
      if (personnelError) {
        throw personnelError;
      }
      
      setAssignments(assignmentsData || []);
      setPersonnel(personnelData || []);
      setSelectedTerm(termId);
      setViewMode("details");
    } catch (error) {
      console.error("Error fetching term details:", error);
      toast.error("Failed to load term details");
    } finally {
      setLoading(false);
    }
  };

  const deleteTerm = async (termId: string) => {
    if (confirm("Are you sure you want to delete this term? This will also delete all related assignments and personnel data.")) {
      try {
        // First delete assignments and personnel (they have foreign key constraints)
        await supabase.from('term_assignments').delete().eq('term_id', termId);
        await supabase.from('term_personnel').delete().eq('term_id', termId);
        
        // Then delete the term
        const { error } = await supabase.from('court_terms').delete().eq('id', termId);
        
        if (error) {
          throw error;
        }
        
        toast.success("Term deleted successfully");
        fetchTerms();
      } catch (error) {
        console.error("Error deleting term:", error);
        toast.error("Failed to delete term");
      }
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [statusFilter]);

  const filteredTerms = terms.filter(term => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (term.term_name?.toLowerCase() || "").includes(searchLower) ||
      (term.term_number?.toLowerCase() || "").includes(searchLower) ||
      (term.location?.toLowerCase() || "").includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "upcoming":
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Upcoming</Badge>;
      case "expired":
        return <Badge variant="outline" className="text-gray-500 border-gray-500">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const handleBack = () => {
    setViewMode("terms");
    setSelectedTerm(null);
  };
  
  const handleViewPersonnel = () => {
    setViewMode("personnel");
  };
  
  const handleViewAssignments = () => {
    setViewMode("details");
  };
  
  const renderTermList = () => {
    return (
      <>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setStatusFilter(statusFilter === "all" ? "active" : "all")}
            >
              <Filter className="h-4 w-4" />
              {statusFilter === "all" ? "All Terms" : "Active Terms Only"}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("upcoming")}>Upcoming</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("expired")}>Expired</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No terms found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((term) => (
              <Card key={term.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{term.term_name || "Unnamed Term"}</CardTitle>
                      <CardDescription>{term.term_number}</CardDescription>
                    </div>
                    {getStatusBadge(term.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{term.location || "No location specified"}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {term.start_date && term.end_date ? (
                          `${format(new Date(term.start_date), "MMM d, yyyy")} - ${format(new Date(term.end_date), "MMM d, yyyy")}`
                        ) : (
                          "No dates specified"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{term.assignmentCount} assignments</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{term.personnelCount} personnel</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchTermDetails(term.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => window.open(term.pdf_url, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => fetchTermDetails(term.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => navigate(`/terms/edit/${term.id}`)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Term
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteTerm(term.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Term
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderTermDetails = () => {
    const term = terms.find(t => t.id === selectedTerm);
    
    if (!term) return null;
    
    return (
      <>
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={handleBack}
        >
          &larr; Back to Terms
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{term.term_name}</h2>
            <p className="text-muted-foreground">{term.term_number} | {term.location}</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={viewMode === "details" ? "default" : "outline"} 
              onClick={handleViewAssignments}
            >
              Assignments ({assignments.length})
            </Button>
            <Button 
              variant={viewMode === "personnel" ? "default" : "outline"} 
              onClick={handleViewPersonnel}
            >
              Personnel ({personnel.length})
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(term.pdf_url, '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              View PDF
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md p-4 mb-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Term Period</h3>
              <p className="flex items-center mt-1 text-gray-900">
                <CalendarDays className="h-4 w-4 mr-2" />
                {term.start_date && term.end_date ? (
                  `${format(new Date(term.start_date), "MMMM d, yyyy")} - ${format(new Date(term.end_date), "MMMM d, yyyy")}`
                ) : (
                  "No dates specified"
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Status</h3>
              <p className="mt-1">{getStatusBadge(term.status)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">PDF Uploaded</h3>
              <p className="mt-1 text-gray-900">{format(new Date(term.created_at), "MMMM d, yyyy")}</p>
            </div>
          </div>
        </div>
        
        {viewMode === "details" ? (
          <>
            <h3 className="text-lg font-medium mb-4 text-gray-900">Court Assignments</h3>
            {assignments.length === 0 ? (
              <div className="text-center border rounded-md p-8 bg-white">
                <p className="text-muted-foreground">No assignments available for this term.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-900">Part</TableHead>
                        <TableHead className="text-gray-900">Justice</TableHead>
                        <TableHead className="text-gray-900">Room</TableHead>
                        <TableHead className="text-gray-900">Phone/Fax</TableHead>
                        <TableHead className="text-gray-900">Sgt.</TableHead>
                        <TableHead className="text-gray-900">Clerks</TableHead>
                        <TableHead className="text-gray-900 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium text-gray-900">
                            {assignment.court_parts?.part_code || assignment.part_id}
                          </TableCell>
                          <TableCell className="text-gray-900">{assignment.justice_name}</TableCell>
                          <TableCell className="text-gray-900">
                            {assignment.rooms?.room_number || "—"}
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {assignment.phone && (
                              <div>{assignment.phone}</div>
                            )}
                            {assignment.fax && (
                              <div className="text-gray-600 text-sm">Fax: {assignment.fax}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {assignment.sergeant_name || "—"}
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {assignment.clerk_names && assignment.clerk_names.length > 0 
                              ? assignment.clerk_names.join(', ')
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAssignment(assignment)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium mb-4">Court Personnel</h3>
            {personnel.length === 0 ? (
              <div className="text-center border rounded-md p-8">
                <p className="text-muted-foreground">No personnel data available for this term.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personnel.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium">{person.name}</TableCell>
                          <TableCell>{person.role}</TableCell>
                          <TableCell>
                            {person.phone && (
                              <div className="text-sm">{person.phone}</div>
                            )}
                            {person.extension && (
                              <div className="text-xs">Ext: {person.extension}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {(person.room || person.floor) ? (
                              <>
                                {person.room && <span>Room {person.room}</span>}
                                {person.room && person.floor && <span>, </span>}
                                {person.floor && <span>Floor {person.floor}</span>}
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}

      {editingAssignment && (
        <EditTermAssignmentDialog
          isOpen={true}
          onClose={() => setEditingAssignment(null)}
          assignment={editingAssignment}
          onSave={() => {
            fetchTermDetails(selectedTerm!);
            setEditingAssignment(null);
          }}
        />
      )}
    </>
  );
};

  return (
    <div className="w-full">
      {viewMode === "terms" ? renderTermList() : renderTermDetails()}
    </div>
  );
}
