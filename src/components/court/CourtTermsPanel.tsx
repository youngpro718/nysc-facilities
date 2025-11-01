import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  MapPin, 
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Gavel,
  Shield,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { TermUploadDialog } from "./TermUploadDialog";

interface CourtTerm {
  id: string;
  term_number: string;
  location: string;
  date_period: string;
  building_id: string;
  term_status: string;
  uploaded_pdf_path?: string;
  extracted_data?: any;
  courtroom_assignments?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  building_name?: string;
  assignment_count?: number;
  total_rooms?: number;
  completion_percentage?: number;
}

interface TermAssignment {
  id: string;
  room_number: string;
  courtroom_number: string;
  justice: string;
  clerks: string[];
  sergeant: string;
  part: string;
  calendar_day: string;
  tel: string;
  fax: string;
}

interface CourtTermsPanelProps {
  onTermSelected?: (termId: string) => void;
}

export const CourtTermsPanel = ({ onTermSelected }: CourtTermsPanelProps) => {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [termDetailOpen, setTermDetailOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: terms, isLoading } = useQuery({
    queryKey: ["court-terms"],
    queryFn: async (): Promise<any[]> => {
      const { data: termsData, error: termsError } = await supabase
        .from("court_terms")
        .select("*")
        .order("created_at", { ascending: false });

      if (termsError) throw termsError;

      // Get assignment counts for each term
      const { data: assignmentsData } = await supabase
        .from("court_assignments")
        .select("term_id");

      const assignmentCounts = new Map();
      assignmentsData?.forEach(assignment => {
        if (assignment.term_id) {
          const count = assignmentCounts.get(assignment.term_id) || 0;
          assignmentCounts.set(assignment.term_id, count + 1);
        }
      });

      return (termsData || []).map((term: any) => {
        const assignmentCount = assignmentCounts.get(term.id) || 0;

        return {
          id: term.id,
          term_number: term.term_number || "",
          location: term.location || "",
          date_period: term.date_period || "",
          building_id: term.building_id || "",
          term_status: term.term_status || "active",
          uploaded_pdf_path: term.uploaded_pdf_path,
          extracted_data: term.extracted_data,
          courtroom_assignments: term.courtroom_assignments,
          notes: term.notes,
          created_at: term.created_at,
          updated_at: term.updated_at,
          building_name: "",
          assignment_count: assignmentCount,
          total_rooms: 10,
          completion_percentage: assignmentCount > 0 ? Math.round((assignmentCount / 10) * 100) : 0,
        };
      });
    },
  });

  // Get detailed term data when modal is opened
  const { data: selectedTermDetails, isLoading: termDetailsLoading } = useQuery({
    queryKey: ["term-details", selectedTermId],
    queryFn: async (): Promise<{ term: any; assignments: TermAssignment[] } | null> => {
      if (!selectedTermId) return null;

      const { data: termData, error: termError } = await supabase
        .from("court_terms")
        .select("*")
        .eq("id", selectedTermId)
        .single();

      if (termError) throw termError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("*")
        .eq("term_id", selectedTermId);

      if (assignmentsError) throw assignmentsError;

      const assignments: TermAssignment[] = (assignmentsData || []).map(assignment => ({
        id: assignment.id,
        room_number: assignment.room_number || "",
        courtroom_number: assignment.room_number || "",
        justice: assignment.justice || "",
        clerks: [],
        sergeant: assignment.sergeant || "",
        part: assignment.part || "",
        calendar_day: assignment.calendar_day || "",
        tel: assignment.tel || "",
        fax: assignment.fax || "",
      }));

      return {
        term: {
          ...termData,
          building_name: "",
        },
        assignments,
      };
    },
    enabled: !!selectedTermId && termDetailOpen,
  });

  // Activate/Deactivate term mutation
  const toggleTermStatusMutation = useMutation({
    mutationFn: async ({ termId, newStatus }: { termId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("court_terms")
        .update({ term_status: newStatus })
        .eq("id", termId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Term Status Updated",
        description: "Term status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["court-terms"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update term status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const getTermStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const handleTermClick = (termId: string) => {
    setSelectedTermId(termId);
    setTermDetailOpen(true);
  };

  const handleViewAffectedSessions = () => {
    // TODO: Implement affected sessions view
    console.log("View affected sessions clicked");
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading court terms...</div>;
  }

  const activeTerms = terms?.filter(t => t.term_status === "active") || [];
  const upcomingTerms = terms?.filter(t => t.term_status === "upcoming") || [];
  const completedTerms = terms?.filter(t => t.term_status === "completed") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Court Terms</h2>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Add Term
        </Button>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeTerms.length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Terms</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingTerms.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {terms?.reduce((sum, term) => sum + (term.assignment_count || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all terms</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewAffectedSessions}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Terms</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{completedTerms.length}</div>
            <p className="text-xs text-muted-foreground">Finished terms</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Terms */}
      {activeTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Active Terms ({activeTerms.length})
          </h3>
          <div className="grid gap-4">
            {activeTerms.map((term) => (
              <Card 
                key={term.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-green-300"
                onClick={() => handleTermClick(term.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        Term {term.term_number}
                        <Badge variant="outline">Active</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {term.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {term.building_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTermStatusColor(term.term_status)}>
                        {term.term_status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{term.assignment_count} / {term.total_rooms} assignments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span>{term.date_period}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getCompletionColor(term.completion_percentage || 0)}`}>
                        {term.completion_percentage}% complete
                      </span>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        toggleTermStatusMutation.mutate({ 
                          termId: term.id, 
                          newStatus: term.term_status === "active" ? "completed" : "active" 
                        });
                      }}>
                        {term.term_status === "active" ? "Mark Complete" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Terms */}
      {upcomingTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Upcoming Terms ({upcomingTerms.length})
          </h3>
          <div className="grid gap-3">
            {upcomingTerms.map((term) => (
              <Card 
                key={term.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300"
                onClick={() => handleTermClick(term.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Term {term.term_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {term.date_period || "No date"} • {term.location || "No location"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTermStatusColor(term.term_status)}>
                        {term.term_status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        toggleTermStatusMutation.mutate({ termId: term.id, newStatus: "active" });
                      }}>
                        Activate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Terms */}
      {completedTerms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-600" />
            Completed Terms ({completedTerms.length})
          </h3>
          <div className="grid gap-2">
            {completedTerms.slice(0, 5).map((term) => (
              <Card 
                key={term.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => handleTermClick(term.id)}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-sm">Term {term.term_number}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed {format(new Date(term.updated_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {term.assignment_count} assignments
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {completedTerms.length > 5 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                +{completedTerms.length - 5} more completed terms
              </p>
            )}
          </div>
        </div>
      )}

      {/* Term Detail Modal */}
      <Dialog open={termDetailOpen} onOpenChange={setTermDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Term {selectedTermDetails?.term.term_number || "Details"}
            </DialogTitle>
          </DialogHeader>

          {termDetailsLoading ? (
            <div className="flex justify-center p-8">Loading term details...</div>
          ) : selectedTermDetails && (
            <div className="space-y-6">
              {/* Term Overview */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Term Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Term Number</p>
                      <p className="text-sm text-muted-foreground">{selectedTermDetails.term.term_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Period</p>
                      <p className="text-sm text-muted-foreground">{selectedTermDetails.term.date_period}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{selectedTermDetails.term.location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Building</p>
                      <p className="text-sm text-muted-foreground">{selectedTermDetails.term.building_name}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assignment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Total Assignments</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedTermDetails.assignments.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge className={getTermStatusColor(selectedTermDetails.term.term_status)}>
                        {selectedTermDetails.term.term_status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assignments List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Court Assignments ({selectedTermDetails.assignments.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedTermDetails.assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Courtroom {assignment.courtroom_number || assignment.room_number}
                            </p>
                            <p className="text-sm text-muted-foreground">Part {assignment.part}</p>
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              <Gavel className="h-4 w-4" />
                              {assignment.justice}
                            </p>
                            {assignment.sergeant && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                {assignment.sergeant}
                              </p>
                            )}
                          </div>
                          <div>
                            {assignment.clerks.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">Clerks:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {assignment.clerks.map((clerk, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {clerk}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <TermUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onCreated={(termId) => {
          queryClient.invalidateQueries({ queryKey: ["court-terms"] });
          setUploadDialogOpen(false);
          toast({
            title: "Term Created",
            description: "The term has been added successfully.",
          });
        }}
      />


    </div>
  );
};