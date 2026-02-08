import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LightingIssue, LightingIssueStatus } from '@/types/lightingIssue';
import { supabase } from '@/lib/supabase';

const BULB_TYPES = ['LED', 'Fluorescent', 'Incandescent', 'Other'];
const FORM_FACTORS = ['Long', 'Short', 'Round', 'Other'];
const ISSUE_TYPES = [
  { value: 'blown_bulb', label: 'Blown Bulb' },
  { value: 'ballast_issue', label: 'Ballast Issue' },
  { value: 'other', label: 'Other' }
];
const STATUS_OPTIONS: LightingIssueStatus[] = ['open', 'deferred', 'resolved'];

interface PrefillData {
  location?: string;
  bulb_type?: string;
  form_factor?: string;
  issue_type?: string;
  notes?: string;
}

interface LightingIssueFormProps {
  onSubmitted?: () => void;
  prefillData?: PrefillData;
  onSuccess?: () => void; // Alias for onSubmitted for better semantics
}

export function LightingIssueForm({ onSubmitted, prefillData, onSuccess }: LightingIssueFormProps) {
  // Responsive form layout and modern styling
  const queryClient = useQueryClient();

  const [location, setLocation] = useState(prefillData?.location || '');
  const [bulbType, setBulbType] = useState(prefillData?.bulb_type || 'LED');
  const [formFactor, setFormFactor] = useState(prefillData?.form_factor || 'Long');

  // Sync state with prefillData when it changes
  useEffect(() => {
    setLocation(prefillData?.location || '');
    setBulbType(prefillData?.bulb_type || 'LED');
    setFormFactor(prefillData?.form_factor || 'Long');
    setNotes(prefillData?.notes || '');
    setIssueType(getInitialIssueType());
    // Do not reset status to 'open' unless you want to always reset
  }, [prefillData]);

  // Convert issue_type string to enum value if needed
  const getInitialIssueType = () => {
    if (prefillData?.issue_type === 'Ballast' || prefillData?.issue_type === 'ballast_issue') {
      return 'ballast_issue';
    } else if (prefillData?.issue_type === 'Blown Bulb' || prefillData?.issue_type === 'blown_bulb') {
      return 'blown_bulb';
    }
    return 'blown_bulb';
  };

  const [issueType, setIssueType] = useState<'blown_bulb' | 'ballast_issue' | 'other'>(getInitialIssueType());
  const [status, setStatus] = useState<LightingIssueStatus>('open');
  const [notes, setNotes] = useState(prefillData?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Insert into unified issues table (schema verified: no bulbType/formFactor columns)
    // Persist bulbType and formFactor in tags for downstream filtering/analytics
    const { error } = await supabase
      .from('issues')
      .insert({
        title: `Lighting Issue - ${issueType}`,
        description: notes || `${issueType} issue with ${bulbType} bulb`,
        issue_type: 'lighting',
        priority: 'medium',
        status: status, // use selected status from form
        location_description: location,
        tags: [`bulb_type:${bulbType}`, `form_factor:${formFactor}`]
      });

    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      // Invalidate all issue-related queries for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      queryClient.invalidateQueries({ queryKey: ['roomIssues'] });
      queryClient.invalidateQueries({ queryKey: ['lightingIssues'] });
      
      // Clear form
      setLocation('');
      setBulbType('LED');
      setFormFactor('Long');
      setIssueType('blown_bulb');
      setStatus('open');
      setNotes('');
      
      // Notify parent - support both callback names
      if (onSubmitted) {
        onSubmitted();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Report a Lighting Issue</h3>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Location</label>
          <input
            className="border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Room 101, Hallway B"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Bulb Type</label>
          <select
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground"
            value={bulbType}
            onChange={e => setBulbType(e.target.value)}
          >
            {BULB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Form Factor</label>
          <select
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground"
            value={formFactor}
            onChange={e => setFormFactor(e.target.value)}
          >
            {FORM_FACTORS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Issue Type</label>
          <select
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground"
            value={issueType}
            onChange={e => setIssueType(e.target.value as unknown)}
          >
            {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground"
            value={status}
            onChange={e => setStatus(e.target.value as LightingIssueStatus)}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <textarea
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground min-h-[44px]"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional details..."
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
          <button
            className="w-full md:w-auto h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Report Issue'}
          </button>
        </div>
      </form>
    </div>
  );
}
