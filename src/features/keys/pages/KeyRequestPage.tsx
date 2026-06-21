import { KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { KeyRequestForm } from '@features/keys/components/requests/KeyRequestForm';

/**
 * Standalone /keys/request page. Mirrors the supply-request route experience
 * for users who land here from a deep link, the FAB, or the dashboard.
 */
export default function KeyRequestPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <PageHeader
        title="Request a Key"
        description="Tell the key office which key you need and why."
        icon={KeyRound}
      />
      <Card>
        <CardContent className="p-4 sm:p-6">
          <KeyRequestForm
            variant="page"
            onSuccess={() => navigate('/my-requests?type=key')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
