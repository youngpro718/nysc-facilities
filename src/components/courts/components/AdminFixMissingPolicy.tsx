import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function AdminFixMissingPolicy() {
  const { toast } = useToast();

  const copySQL = () => {
    const sql = `-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON court_terms;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON term_assignments;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON term_personnel;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON court_parts;

-- Then recreate them with proper permissions
CREATE POLICY "Allow delete for authenticated users" ON court_terms FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON term_assignments FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON term_personnel FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON court_parts FOR DELETE TO authenticated USING (true);`;
    
    navigator.clipboard.writeText(sql);
    
    toast({
      title: "SQL Copied",
      description: "SQL commands copied to clipboard for your administrator.",
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Term Deletion Fix</CardTitle>
        <CardDescription>
          Missing DELETE policies preventing term deletion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          The database needs updated permission policies to allow term deletion. Share these SQL commands with your database administrator:
        </p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON court_terms;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON term_assignments;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON term_personnel;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON court_parts;

-- Then recreate them with proper permissions
CREATE POLICY "Allow delete for authenticated users" ON court_terms FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON term_assignments FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON term_personnel FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON court_parts FOR DELETE TO authenticated USING (true);`}
        </pre>
      </CardContent>
      <CardFooter>
        <Button onClick={copySQL} className="w-full">
          Copy SQL Commands to Clipboard
        </Button>
      </CardFooter>
    </Card>
  );
} 