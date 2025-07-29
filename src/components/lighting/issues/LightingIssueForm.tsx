import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LightingIssue, LightingIssueStatus } from '@/types/lightingIssue';
import { supabase } from '@/integrations/supabase/client';

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
    
    // Insert into unified issues table
    const { error } = await supabase
      .from('issues')
      .insert({
        title: `Lighting Issue - ${issueType}`,
        description: notes || `${issueType} issue with ${bulbType} bulb`,
        issue_type: 'lighting',
        priority: 'medium',
        status: 'open',
        location_description: location
      } as any);

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
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 max-w-2xl mx-auto mb-8">
      <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">Report a Lighting Issue</h3>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Location</label>
          <input
            className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Room 101, Hallway B"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Bulb Type</label>
          <select
            className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            value={bulbType}
            onChange={e => setBulbType(e.target.value)}
          >
            {BULB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Form Factor</label>
          <select
            className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            value={formFactor}
            onChange={e => setFormFactor(e.target.value)}
          >
            {FORM_FACTORS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Issue Type</label>
          <select
            className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            value={issueType}
            onChange={e => setIssueType(e.target.value as any)}
          >
            {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Status</label>
          <select
            className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            value={status}
            onChange={e => setStatus(e.target.value as LightingIssueStatus)}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Notes</label>
          <textarea
            className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 min-h-[48px]"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional details..."
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
          <button
            className="w-full md:w-auto px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition disabled:opacity-60"
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
