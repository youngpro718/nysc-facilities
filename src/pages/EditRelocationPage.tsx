// src/pages/EditRelocationPage.tsx
import { useParams } from 'react-router-dom';
import { EditRelocationForm } from '@/components/relocations/forms/EditRelocationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function EditRelocationPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    // Handle the case where id is not present, maybe redirect or show an error
    return <div>Error: Relocation ID not found in URL.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Relocation</CardTitle>
        </CardHeader>
        <CardContent>
          <EditRelocationForm id={id} />
        </CardContent>
      </Card>
    </div>
  );
}

export default EditRelocationPage;
