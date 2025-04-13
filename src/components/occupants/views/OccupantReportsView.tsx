import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, FileSpreadsheet, PieChart, BarChart, Building, Users, Key } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CSVLink } from "react-csv";
import { format as dateFormat } from "date-fns";

// Report types
type ReportType = "occupancy" | "keys" | "departments" | "status";
type DateRangeType = "all" | "week" | "month" | "year";
type DetailLevelType = "full" | "summary";

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  formats: string[];
}

// Define type for report data
interface OccupancyReportItem {
  building: string;
  totalSpaces: number;
  occupiedSpaces: number;
  occupancyRate: number;
}

interface KeyAssignmentReportItem {
  id: string;
  assigned_at: string | null;
  returned_at: string | null;
  key: {
    id: string;
    name: string;
    type: string;
  } | null;
  occupant: {
    id: string;
    first_name: string;
    last_name: string;
    title: string | null;
    department: string | null;
  } | null;
}

interface DepartmentReportItem {
  department: string;
  count: number;
  percentage: number;
}

interface StatusReportItem {
  status: string;
  count: number;
  percentage: number;
}

type ReportDataItem = OccupancyReportItem | KeyAssignmentReportItem | DepartmentReportItem | StatusReportItem;

export function OccupantReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("occupancy");
  const [format, setFormat] = useState<string>("csv");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeType>("month");
  const [detailLevel, setDetailLevel] = useState<DetailLevelType>("full");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportDataItem[]>([]);
  
  // Define available reports
  const reportOptions: ReportOption[] = [
    {
      id: "occupancy",
      title: "Room Occupancy Report",
      description: "Detailed report of all rooms and their current occupants, including primary assignments and occupancy rates.",
      icon: <Building className="h-5 w-5" />,
      formats: ["csv", "pdf", "excel"]
    },
    {
      id: "keys",
      title: "Key Assignments Report",
      description: "Complete list of all keys and their current assignments, including return status and history.",
      icon: <Key className="h-5 w-5" />,
      formats: ["csv", "pdf", "excel"]
    },
    {
      id: "departments",
      title: "Department Distribution Report",
      description: "Breakdown of occupants by department, including room and key assignments per department.",
      icon: <PieChart className="h-5 w-5" />,
      formats: ["csv", "pdf", "excel"]
    },
    {
      id: "status",
      title: "Occupant Status Report",
      description: "Overview of occupant statuses (active, inactive, etc.) with detailed assignment information.",
      icon: <BarChart className="h-5 w-5" />,
      formats: ["csv", "pdf", "excel"]
    }
  ];
  
  // Get stats for the dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["occupant-report-stats"],
    queryFn: async () => {
      try {
        const [occupantsResult, roomsResult, keysResult, departmentsResult] = await Promise.all([
          supabase.from("occupants").select("id", { count: "exact" }),
          supabase.from("occupant_room_assignments").select("id", { count: "exact" }),
          supabase.from("key_assignments").select("id", { count: "exact" }).is("returned_at", null),
          supabase.from("occupants").select("department").not("department", "is", null)
        ]);
        
        // Get unique departments
        const departments = new Set<string>();
        departmentsResult.data?.forEach(item => {
          if (item.department) departments.add(item.department);
        });
        
        return {
          occupants: occupantsResult.count || 0,
          rooms: roomsResult.count || 0,
          keys: keysResult.count || 0,
          departments: departments.size
        };
      } catch (error) {
        console.error("Error fetching stats:", error);
        return {
          occupants: 0,
          rooms: 0,
          keys: 0,
          departments: 0
        };
      }
    }
  });
  
  // Fetch report data when report type or date range changes
  const { isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ["report-data", selectedReport, dateRangeFilter],
    queryFn: async () => {
      try {
        // Get date range
        const now = new Date();
        let startDate = new Date();
        if (dateRangeFilter === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (dateRangeFilter === "month") {
          startDate.setMonth(now.getMonth() - 1);
        } else if (dateRangeFilter === "year") {
          startDate.setFullYear(now.getFullYear() - 1);
        } else {
          // "all" - no date filtering
          startDate = new Date(0);
        }
        
        const startDateString = startDate.toISOString();
        let data: ReportDataItem[] = [];
        
        if (selectedReport === "occupancy") {
          // Note: Based on memory, we need to query from 'spaces' instead of 'rooms'
          const { data: buildings } = await supabase
            .from("buildings")
            .select("id, name");
          
          const buildingData: OccupancyReportItem[] = [];
          
          for (const building of buildings || []) {
            const { count: totalSpaces } = await supabase
              .from("spaces")
              .select("id", { count: "exact", head: true })
              .eq("building_id", building.id);
              
            const { count: occupiedSpaces } = await supabase
              .from("spaces")
              .select("id", { count: "exact", head: true })
              .eq("building_id", building.id)
              .not("occupant_room_assignments", "is", null);
              
            const occupancyRate = totalSpaces ? Math.round((occupiedSpaces! / totalSpaces) * 100) : 0;
            
            buildingData.push({
              building: building.name,
              totalSpaces: totalSpaces || 0,
              occupiedSpaces: occupiedSpaces || 0,
              occupancyRate
            });
          }
          
          data = buildingData;
        } 
        else if (selectedReport === "keys") {
          // Fetch key assignments data
          const { data: keyAssignments } = await supabase
            .from("key_assignments")
            .select(`
              id,
              assigned_at,
              returned_at,
              key:keys(id, name, type),
              occupant:occupants(id, first_name, last_name, title, department)
            `)
            .gte("assigned_at", dateRangeFilter === "all" ? null : startDateString);
            
          data = (keyAssignments || []) as KeyAssignmentReportItem[];
        }
        else if (selectedReport === "departments") {
          // Fetch department distribution data
          const { data: occupants } = await supabase
            .from("occupants")
            .select("department")
            .not("department", "is", null);
            
          const departmentCounts: Record<string, number> = {};
          let total = 0;
          
          occupants?.forEach(occupant => {
            if (occupant.department) {
              departmentCounts[occupant.department] = (departmentCounts[occupant.department] || 0) + 1;
              total++;
            }
          });
          
          const departmentData: DepartmentReportItem[] = Object.entries(departmentCounts).map(([department, count]) => ({
            department,
            count,
            percentage: Math.round((count / total) * 100)
          }));
          
          data = departmentData;
        }
        else if (selectedReport === "status") {
          // Fetch occupant status data
          const { data: occupants } = await supabase
            .from("occupants")
            .select("status");
            
          const statusCounts: Record<string, number> = {};
          let total = 0;
          
          occupants?.forEach(occupant => {
            const status = occupant.status || "unknown";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            total++;
          });
          
          const statusData: StatusReportItem[] = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            percentage: Math.round((count / total) * 100)
          }));
          
          data = statusData;
        }
        
        setReportData(data);
        return data;
      } catch (error) {
        console.error("Error fetching report data:", error);
        setReportData([]);
        return [];
      }
    },
    enabled: true
  });
  
  // Refetch report data when report type or date range changes
  useEffect(() => {
    refetchReport();
  }, [selectedReport, dateRangeFilter, refetchReport]);
  
  // Handle report generation for non-CSV formats
  const handleGenerateReport = async () => {
    if (format !== "csv") {
      setIsGenerating(true);
      
      try {
        // Simulate report generation for non-CSV formats
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real implementation, this would generate and download the report
        const reportTitle = currentReport?.title || "Report";
        alert(`${reportTitle} generated in ${format.toUpperCase()} format!`);
      } catch (error) {
        console.error("Error generating report:", error);
        alert("Failed to generate report. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    }
    // CSV export is handled by react-csv
  };
  
  // Helper to get report option by ID
  const getReportOption = (id: ReportType): ReportOption | undefined => {
    return reportOptions.find(option => option.id === id);
  };
  
  // Get the currently selected report
  const currentReport = getReportOption(selectedReport);
  
  // Prepare CSV data based on report type
  const getCSVData = () => {
    if (selectedReport === "occupancy") {
      return (reportData as OccupancyReportItem[]).map(item => ({
        Building: item.building,
        "Total Spaces": item.totalSpaces,
        "Occupied Spaces": item.occupiedSpaces,
        "Occupancy Rate": `${item.occupancyRate}%`
      }));
    }
    else if (selectedReport === "keys") {
      return (reportData as KeyAssignmentReportItem[]).map(item => {
        let assignedDate = "N/A";
        if (item.assigned_at) {
          assignedDate = dateFormat(new Date(item.assigned_at), "MMM d, yyyy");
        }
        
        let returnedDate = "N/A";
        if (item.returned_at) {
          returnedDate = dateFormat(new Date(item.returned_at), "MMM d, yyyy");
        }
          
        return {
          "Key": item.key?.name || "Unknown",
          "Key Type": item.key?.type || "Unknown",
          "Assigned To": `${item.occupant?.first_name || ""} ${item.occupant?.last_name || ""}`,
          "Department": item.occupant?.department || "N/A",
          "Assigned Date": assignedDate,
          "Status": item.returned_at ? "Returned" : "Active",
          "Returned Date": returnedDate
        };
      });
    }
    else if (selectedReport === "departments") {
      return (reportData as DepartmentReportItem[]).map(item => ({
        "Department": item.department,
        "Number of Occupants": item.count,
        "Percentage": `${item.percentage}%`
      }));
    }
    else if (selectedReport === "status") {
      return (reportData as StatusReportItem[]).map(item => ({
        "Status": item.status,
        "Number of Occupants": item.count,
        "Percentage": `${item.percentage}%`
      }));
    }
    
    return [];
  };
  
  // Get CSV filename
  const getCSVFilename = () => {
    let reportName = 'report';
    if (currentReport && currentReport.title) {
      reportName = currentReport.title.replace(/\s+/g, '_').toLowerCase();
    }
    const dateStr = dateFormat(new Date(), "yyyy-MM-dd");
    return `${reportName}_${dateStr}.csv`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Occupants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.occupants}
            </div>
            <p className="text-xs text-muted-foreground">
              Active and inactive personnel
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Room Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.rooms}
            </div>
            <p className="text-xs text-muted-foreground">
              Total active room assignments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Key Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.keys}
            </div>
            <p className="text-xs text-muted-foreground">
              Active key assignments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.departments}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique departments
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>
                Select a report to generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportOptions.map(option => (
                  <Button
                    key={option.id}
                    variant={selectedReport === option.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedReport(option.id)}
                  >
                    <div className="mr-2">{option.icon}</div>
                    <div className="text-left">
                      <div className="font-medium">{option.title}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{currentReport?.title}</CardTitle>
              <CardDescription>
                {currentReport?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview">
                <TabsList className="mb-4">
                  <TabsTrigger value="preview">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="options">
                    <Users className="mr-2 h-4 w-4" />
                    Options
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="space-y-4">
                  <div className="rounded-md border p-4">
                    {reportLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : reportData.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        No data available for this report. Try changing the date range.
                      </div>
                    ) : (
                      <>
                        {selectedReport === "occupancy" && (
                          <div className="space-y-4">
                            <div className="text-sm font-medium">Room Occupancy Rates</div>
                            <div className="space-y-2">
                              {(reportData as OccupancyReportItem[]).map((item, index) => (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span>{item.building}</span>
                                    <span>{item.occupancyRate}%</span>
                                  </div>
                                  <Progress value={item.occupancyRate} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedReport === "departments" && (
                          <div className="space-y-4">
                            <div className="text-sm font-medium">Department Distribution</div>
                            <div className="space-y-2">
                              {(reportData as DepartmentReportItem[]).map((item, index) => (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span>{item.department}</span>
                                    <span>{item.percentage}%</span>
                                  </div>
                                  <Progress value={item.percentage} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedReport === "keys" && (
                          <div className="space-y-4">
                            <div className="text-sm font-medium">Key Assignments</div>
                            <div className="overflow-auto max-h-64">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">Key</th>
                                    <th className="text-left py-2">Assigned To</th>
                                    <th className="text-left py-2">Status</th>
                                    <th className="text-left py-2">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(reportData as KeyAssignmentReportItem[]).slice(0, 10).map((item, index) => {
                                    let formattedDate = "Unknown";
                                    if (item.assigned_at) {
                                      formattedDate = dateFormat(new Date(item.assigned_at), "MMM d, yyyy");
                                    }
                                    
                                    return (
                                      <tr key={index} className="border-b">
                                        <td className="py-2">{item.key?.name || "Unknown"}</td>
                                        <td className="py-2">
                                          {item.occupant ? `${item.occupant.first_name} ${item.occupant.last_name}` : "Unknown"}
                                        </td>
                                        <td className="py-2">{item.returned_at ? "Returned" : "Active"}</td>
                                        <td className="py-2">{formattedDate}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              {reportData.length > 10 && (
                                <div className="text-center text-muted-foreground mt-2">
                                  Showing 10 of {reportData.length} records
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {selectedReport === "status" && (
                          <div className="space-y-4">
                            <div className="text-sm font-medium">Occupant Status Distribution</div>
                            <div className="space-y-2">
                              {(reportData as StatusReportItem[]).map((item, index) => (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span>{item.status}</span>
                                    <span>{item.percentage}%</span>
                                  </div>
                                  <Progress value={item.percentage} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="options" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Format</label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentReport && currentReport.formats ? 
                            currentReport.formats.map((fmt: string) => (
                              <SelectItem key={fmt} value={fmt}>
                                {fmt.toUpperCase()}
                              </SelectItem>
                            )) 
                          : null}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Date Range</label>
                      <Select 
                        value={dateRangeFilter} 
                        onValueChange={(value: string) => setDateRangeFilter(value as DateRangeType)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="year">Past Year</SelectItem>
                          <SelectItem value="month">Past Month</SelectItem>
                          <SelectItem value="week">Past Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Include Details</label>
                      <Select 
                        value={detailLevel} 
                        onValueChange={(value: string) => setDetailLevel(value as DetailLevelType)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select detail level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Details</SelectItem>
                          <SelectItem value="summary">Summary Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <div className="w-full flex gap-2">
                {format === "csv" ? (
                  <CSVLink
                    data={getCSVData()}
                    filename={getCSVFilename()}
                    className="w-full"
                  >
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                  </CSVLink>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate {format.toUpperCase()} Report
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
