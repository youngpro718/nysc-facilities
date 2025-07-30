import { useEffect, useState } from 'react';
import { LightingIssue, LightingIssueStatus } from '@/types/lightingIssue';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, Loader2, Building, Layers } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_OPTIONS: LightingIssueStatus[] = ['open', 'deferred', 'resolved'];

export function LightingIssuesList() {
  // Modern, readable, responsive table UI
  const [issues, setIssues] = useState<LightingIssue[]>([]);
  const [statusFilter, setStatusFilter] = useState<LightingIssueStatus | 'all'>('open');
  const [loading, setLoading] = useState(false);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<{id: string, name: string}[]>([]);
  const [floors, setFloors] = useState<{id: string, name: string, building_id: string}[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');

  // Fetch buildings for filter dropdown
  useEffect(() => {
    const fetchBuildings = async () => {
      const { data } = await supabase
        .from('buildings')
        .select('id, name')
        .order('name');
      
      if (data) {
        setBuildings(data);
      }
    };
    
    fetchBuildings();
  }, []);
  
  // Fetch floors for selected building
  useEffect(() => {
    const fetchFloors = async () => {
      let query = supabase.from('floors').select('id, name, building_id').order('name');
      
      if (selectedBuilding !== 'all') {
        query = query.eq('building_id', selectedBuilding);
      }
      
      const { data } = await query;
      
      if (data) {
        setFloors(data);
        // Reset floor selection when building changes
        if (selectedFloor !== 'all') {
          setSelectedFloor('all');
        }
      }
    };
    
    fetchFloors();
  }, [selectedBuilding]);
  
  const fetchIssues = () => {
    setLoading(true);
    let query = supabase.from('issues').select('*').eq('issue_type', 'lighting').order('created_at', { ascending: false });
    
    // Apply filters  
    if (statusFilter !== 'all') {
      const validStatus = statusFilter === 'deferred' ? 'in_progress' : statusFilter;
      query = query.eq('status', validStatus);
    }
    
    // Apply location filters if selected
    // Note: This assumes the location field contains building and floor info
    // We'll filter client-side since the location is stored as a string
    
    query.then(({ data, error }) => {
      setLoading(false);
      if (data) {
        // Client-side filtering for location
        let filteredData = [...data];
        
        if (selectedBuilding !== 'all') {
          const buildingName = buildings.find(b => b.id === selectedBuilding)?.name;
          if (buildingName) {
            filteredData = filteredData.filter(issue => 
              (issue as any).building_id === selectedBuilding
            );
          }
        }
        
        if (selectedFloor !== 'all') {
          filteredData = filteredData.filter(issue => 
            (issue as any).floor_id === selectedFloor
          );
        }
        
        setIssues(filteredData as unknown as LightingIssue[]);
      }
    });
  };
  
  useEffect(() => {
    fetchIssues();
  }, [statusFilter, selectedBuilding, selectedFloor]);
  
  const updateIssueStatus = async (issueId: string, newStatus: LightingIssueStatus) => {
    setUpdatingIssueId(issueId);
    
    const updates: Record<string, any> = { status: newStatus };
    
    // If resolving, add resolved_at timestamp
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    } else if (newStatus === 'open') {
      // If reopening, clear resolved_at
      updates.resolved_at = null;
    }
    
    const { error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId);
      
    if (!error) {
      // Update local state to avoid refetch
      setIssues(issues.map(issue => 
        issue.id === issueId ? { ...issue, ...updates } : issue
      ));
    }
    
    setUpdatingIssueId(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">Lighting Issues</h3>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold">Lighting Issues</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <select
              className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LightingIssueStatus | 'all')}
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium flex items-center">
              <Building className="h-3 w-3 mr-1" /> Building:
            </span>
            <select
              className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              <option value="all">All Buildings</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium flex items-center">
              <Layers className="h-3 w-3 mr-1" /> Floor:
            </span>
            <select
              className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              disabled={selectedBuilding === 'all'}
            >
              <option value="all">All Floors</option>
              {floors.map(floor => (
                <option key={floor.id} value={floor.id}>{floor.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8 text-zinc-500">Loading...</div>
      ) : issues.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">No lighting issues found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Location</th>
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Bulb Type</th>
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Form Factor</th>
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Issue Type</th>
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Status</th>
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Notes</th>
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Reported</th>
                <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, idx) => (
                <tr
                  key={issue.id}
                  className={
                    (idx % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950') +
                    ' hover:bg-blue-50 dark:hover:bg-zinc-800 transition'
                  }
                >
                   <td className="px-3 py-2 whitespace-nowrap">{(issue as any).description || 'No location'}</td>
                   <td className="px-3 py-2 whitespace-nowrap">{(issue as any).type || 'Unknown'}</td>
                   <td className="px-3 py-2 whitespace-nowrap">{(issue as any).priority || 'Medium'}</td>
                   <td className="px-3 py-2 whitespace-nowrap capitalize">{(issue as any).type || 'general'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={
                      'inline-block px-2 py-1 rounded font-semibold ' +
                      (issue.status === 'open'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        : issue.status === 'resolved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200')
                    }>
                      {issue.status}
                    </span>
                  </td>
                   <td className="px-3 py-2 whitespace-pre-line max-w-xs truncate">{(issue as any).description || 'No notes'}</td>
                   <td className="px-3 py-2 whitespace-nowrap">{new Date((issue as any).created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <TooltipProvider>
                      <div className="flex gap-1">
                        {issue.status !== 'resolved' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => updateIssueStatus(issue.id, 'resolved')}
                                disabled={updatingIssueId === issue.id}
                              >
                                {updatingIssueId === issue.id ? 
                                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                                  <CheckCircle className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as resolved</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {issue.status !== 'deferred' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50"
                                onClick={() => updateIssueStatus(issue.id, 'deferred')}
                                disabled={updatingIssueId === issue.id}
                              >
                                {updatingIssueId === issue.id ? 
                                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                                  <Clock className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as deferred</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {issue.status !== 'open' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => updateIssueStatus(issue.id, 'open')}
                                disabled={updatingIssueId === issue.id}
                              >
                                {updatingIssueId === issue.id ? 
                                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                                  <AlertCircle className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reopen issue</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
