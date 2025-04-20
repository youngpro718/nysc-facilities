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

// --- Formatting Helpers ---
function formatPart(part: string | undefined, fallback: string | undefined) {
  // Accepts letters, numbers, hyphens, spaces, e.g. IDV, N-SCT, TAP A, TAP G, GWP1, TAP B, MDC-92
  if (typeof part === 'string' && part.trim()) return part;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return '—';
}

function formatPhone(phone: string | undefined) {
  if (!phone) return '—';
  // Already formatted: (6)4051
  if (/^\(\d\)\d{4}$/.test(phone)) return phone;
  // Try to format 64051 or 4051 as (6)4051
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 5 && digits[0] === '6') {
    return `(6)${digits.slice(1)}`;
  }
  if (digits.length === 4) {
    return `(6)${digits}`;
  }
  return phone;
}

function formatSergeant(sgt: string | undefined) {
  if (!sgt || typeof sgt !== 'string') return '—';
  // Only use last name (all caps, hyphenated allowed)
  const parts = sgt.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1].replace(/[^A-Z\-]/gi, '') : sgt;
}

function formatClerks(clerks: string[] | string | undefined) {
  // Display as initial + last name, comma separated. Hyphenated last names allowed.
  if (!clerks) return '—';
  if (typeof clerks === 'string') clerks = clerks.split(',').map(c => c.trim()).filter(Boolean);
  if (!Array.isArray(clerks) || clerks.length === 0) return '—';
  return clerks.map(name => {
    // If name is like "T. Cedeno-Barrett", just return as is
    if (/^[A-Z]\.\s+[A-Za-z\-']+$/.test(name)) return name;
    // If name is like "T Cedeno-Barrett" or "T. Cedeno Barrett"
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      let initial = parts[0].replace(/[^A-Z.]/gi, '');
      let last = parts.slice(1).join(' ').replace(/[^A-Za-z\-']/gi, '');
      return `${initial} ${last}`;
    }
    return name;
  }).join(', ');
}


export function TermList() {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ phone: string; sgt: string; clerks: string }>({ phone: '', sgt: '', clerks: '' });

  // Handler to start editing a row
  const handleEdit = (idx: number, assignment: any) => {
    setEditingIdx(idx);
    setEditValues({
      phone: assignment.phone || '',
      sgt: assignment.sgt || '',
      clerks: assignment.clerks ? (Array.isArray(assignment.clerks) ? assignment.clerks.join(', ') : assignment.clerks) : ''
    });
  };

  // Handler to cancel editing
  const handleCancel = () => {
    setEditingIdx(null);
    setEditValues({ phone: '', sgt: '', clerks: '' });
  };

  // Handler to save edits (for now, just updates local assignments array)
  const handleSave = (idx: number) => {
    // TODO: Save to backend if desired
    if (assignments[idx]) {
      assignments[idx].phone = editValues.phone;
      assignments[idx].sgt = editValues.sgt;
      assignments[idx].clerks = editValues.clerks.split(',').map((c: string) => c.trim()).filter(Boolean);
    }
    setEditingIdx(null);
    setEditValues({ phone: '', sgt: '', clerks: '' });
  };

  // Handler for controlled input changes
  const handleEditChange = (idx: number, field: 'phone' | 'sgt' | 'clerks', value: string) => {
    if (editingIdx !== idx) return;
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const navigate = useNavigate();
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"details" | "personnel">("details");

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
    if (!confirm("Are you sure you want to delete this term? This action cannot be undone.")) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('court_terms')
        .delete()
        .eq('id', termId);
        
      if (error) {
        throw error;
      }
      
      toast.success("Term deleted successfully");
      fetchTerms();
    } catch (error) {
      console.error("Error deleting term:", error);
      toast.error("Failed to delete term");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [statusFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredTerms = terms.filter(term => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      term.term_name.toLowerCase().includes(query) ||
      term.term_number.toLowerCase().includes(query) ||
      term.location.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-gray-500">Completed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const handleBack = () => {
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Court Terms</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/terms/new")}>
              Add New Term
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search terms..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status:</span>
            <Tabs defaultValue={statusFilter} className="w-auto" onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Loading terms...</p>
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="text-center border rounded-md p-8">
            <p className="text-muted-foreground">No terms found. Try adjusting your search or filters.</p>
            <Button className="mt-4" variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((term) => (
              <Card key={term.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>{term.term_name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{term.term_number}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{term.location}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      {getStatusBadge(term.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {term.start_date && term.end_date ? (
                        `${format(new Date(term.start_date), "MMM d")} - ${format(new Date(term.end_date), "MMM d, yyyy")}`
                      ) : (
                        "No dates specified"
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{term.assignmentCount} Assignments</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{term.personnelCount} Personnel</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchTermDetails(term.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
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
      <div>
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={handleBack}
        >
          &larr; Back to Terms
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">{term.term_name}</h2>
            <div className="text-muted-foreground">{term.term_number} | {term.location}</div>
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
        
        <div className="border rounded-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Term Period</h3>
              <div className="flex items-center mt-1">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>
                  {term.start_date && term.end_date ? (
                    `${format(new Date(term.start_date), "MMMM d, yyyy")} - ${format(new Date(term.end_date), "MMMM d, yyyy")}`
                  ) : (
                    "No dates specified"
                  )}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="mt-1">{getStatusBadge(term.status)}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">PDF Uploaded</h3>
              <p className="mt-1">{format(new Date(term.created_at), "MMMM d, yyyy")}</p>
            </div>
          </div>
        </div>
        
        {viewMode === "details" ? (
          <div>
            <h3 className="text-lg font-medium mb-4">Court Assignments</h3>
            {assignments.length === 0 ? (
              <div className="text-center border rounded-md p-8">
                <p className="text-muted-foreground">No assignments available for this term.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-200 dark:bg-gray-900">
                        <TableHead>Part</TableHead>
                        <TableHead>Justice</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>SGT</TableHead>
                        <TableHead>Clerks</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment, idx) => {
                        const isEditing = editingIdx === idx;
                        return (
                          <TableRow key={assignment.id || idx} className={isEditing ? "bg-yellow-100 dark:bg-yellow-900" : "even:bg-gray-50 dark:even:bg-gray-900"}>
                            <TableCell>{formatPart(assignment.part, assignment.court_parts?.part_code)}</TableCell>
                            <TableCell>{assignment.justice || assignment.justice_name}</TableCell>
                            <TableCell>{assignment.room || assignment.rooms?.room_number}</TableCell>
                            <TableCell>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editValues.phone}
                                  onChange={e => handleEditChange(idx, 'phone', e.target.value)}
                                  className="border rounded px-1 py-0.5 w-24 bg-yellow-50 dark:bg-yellow-900 text-black dark:text-white"
                                />
                              ) : (
                                formatPhone(assignment.phone)
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editValues.sgt}
                                  onChange={e => handleEditChange(idx, 'sgt', e.target.value)}
                                  className="border rounded px-1 py-0.5 w-20 bg-yellow-50 dark:bg-yellow-900 text-black dark:text-white"
                                />
                              ) : (
                                formatSergeant(assignment.sgt)
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editValues.clerks}
                                  onChange={e => handleEditChange(idx, 'clerks', e.target.value)}
                                  className="border rounded px-1 py-0.5 w-44 bg-yellow-50 dark:bg-yellow-900 text-black dark:text-white"
                                />
                              ) : (
                                formatClerks(assignment.clerks)
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <>
                                  <Button size="sm" variant="outline" className="mr-2" onClick={() => handleSave(idx)}>Save</Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleEdit(idx, assignment)}>Edit</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
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
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      {selectedTerm ? renderTermDetails() : renderTermList()}
    </div>
  );
}
