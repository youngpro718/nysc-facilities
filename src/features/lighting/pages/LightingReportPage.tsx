import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LightingIssueForm } from '@features/lighting/components/LightingIssueForm';

export default function LightingReportPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report a Lighting Issue"
        description="Let the Facility Coordinator know about a light that's out, flickering, or damaged."
        icon={Lightbulb}
      />
      <Card className="border-0 sm:border sm:shadow-sm">
        <div className="p-4 sm:p-6">
          <LightingIssueForm
            variant="page"
            onSuccess={() => navigate('/my-requests')}
            onCancel={() => navigate(-1)}
          />
        </div>
      </Card>
    </div>
  );
}
