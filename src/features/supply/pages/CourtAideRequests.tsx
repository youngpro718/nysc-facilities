import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { QuickOrderGrid } from '@features/supply/components/supply/QuickOrderGrid';
import { RequestForm } from '@features/supply/components/request/RequestForm';

export default function CourtAideRequests() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'request' ? 'request' : 'order';

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <header className="mb-4 space-y-1">
        <h1 className="text-2xl font-semibold">Supplies &amp; Requests</h1>
        <p className="text-sm text-muted-foreground">
          Order supplies from the stockroom, or make a request to the court aides.
        </p>
      </header>
      <Tabs
        value={tab}
        onValueChange={(v) =>
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', v);
              return next;
            },
            { replace: true },
          )
        }
      >
        <TabsList className="mb-4">
          <TabsTrigger value="order">Order Supplies</TabsTrigger>
          <TabsTrigger value="request">Make a Request</TabsTrigger>
        </TabsList>
        <TabsContent value="order">
          <QuickOrderGrid />
        </TabsContent>
        <TabsContent value="request">
          <RequestForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
