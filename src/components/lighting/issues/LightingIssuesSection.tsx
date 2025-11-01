import { LightingIssueForm } from './LightingIssueForm';
import { LightingIssuesList } from './LightingIssuesList';
import { useState } from 'react';

export default function LightingIssuesSection() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Report a Lighting Issue</h2>
      <LightingIssueForm onSubmitted={() => setRefreshKey(k => k + 1)} />
      <h2 className="text-xl font-bold">Lighting Issues</h2>
      <LightingIssuesList key={refreshKey} />
    </div>
  );
}
