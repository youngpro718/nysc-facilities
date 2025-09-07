import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MapPin, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

type MaintenanceIssue = {
  id: string;
  title: string;
  description: string;
  space_name: string;
  space_type: string;
  issue_type: string;
  severity: string;
  status: string;
  notes?: string;
  updated_at?: string;
  permanent_solution_needed: boolean;
  created_at: string;
  recurring_issue: boolean;
};

export const MaintenanceIssuesList = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [tempFixText, setTempFixText] = useState<{[key: string]: string}>({});

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ["maintenance-issues", statusFilter, severityFilter],
    queryFn: async () => {
      let query = supabase
        .from("issues")
        .select("*")
        .eq("issue_type", "maintenance")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        const validStatus = statusFilter as any;
        query = query.eq("status", validStatus);
      }
      if (severityFilter !== "all") {
        query = query.eq("priority", severityFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as MaintenanceIssue[];
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const addTemporaryFix = async (issueId: string) => {
    const fixDescription = tempFixText[issueId];
    if (!fixDescription) return;

    const { error } = await supabase
      .from("issues")
      .update({
        status: "in_progress", // Map temporary_fix to in_progress
        notes: `Temporary fix: ${fixDescription}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    if (!error) {
      setTempFixText(prev => ({ ...prev, [issueId]: "" }));
      refetch();
    }
  };

  const markResolved = async (issueId: string) => {
    const { error } = await supabase
      .from("issues")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    if (!error) {
      refetch();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading maintenance issues...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {issues?.map((issue) => (
          <Card key={issue.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {issue.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {issue.space_name} ({issue.space_type})
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(issue.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getSeverityColor(issue.severity)}>
                    {issue.severity}
                  </Badge>
                  <Badge className={getStatusColor(issue.status)}>
                    {issue.status.replace("_", " ")}
                  </Badge>
                  {issue.recurring_issue && (
                    <Badge variant="outline">Recurring</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">{issue.description}</p>
                
                <div className="text-sm">
                  <strong>Issue Type:</strong> <span className="capitalize">{issue.issue_type}</span>
                </div>

                {issue.notes && issue.notes.startsWith('Temporary fix:') && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Temporary Fix Applied
                    </div>
                    <p className="text-sm mt-1 text-yellow-700">{issue.notes.replace('Temporary fix: ', '')}</p>
                    {issue.updated_at && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Applied on {format(new Date(issue.updated_at), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                )}

                {issue.permanent_solution_needed && issue.status !== "resolved" && (
                  <div className="text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Permanent solution needed
                  </div>
                )}

                {issue.status === "reported" && (
                  <div className="space-y-2 pt-2">
                    <Textarea
                      placeholder="Describe temporary fix..."
                      value={tempFixText[issue.id] || ""}
                      onChange={(e) => setTempFixText(prev => ({
                        ...prev,
                        [issue.id]: e.target.value
                      }))}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => addTemporaryFix(issue.id)}
                        disabled={!tempFixText[issue.id]}
                      >
                        Add Temporary Fix
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markResolved(issue.id)}
                      >
                        Mark as Resolved
                      </Button>
                    </div>
                  </div>
                )}

                {issue.status === "in_progress" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => markResolved(issue.id)}
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {issues?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No maintenance issues found
        </div>
      )}
    </div>
  );
};