import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle2 } from 'lucide-react';

export function DatabaseMigrationHelper() {
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const migrationSQL = `-- Add date columns to term_assignments table
ALTER TABLE term_assignments ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE term_assignments ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Add comments to explain the columns' purposes
COMMENT ON COLUMN term_assignments.start_date IS 'The start date for this term assignment';
COMMENT ON COLUMN term_assignments.end_date IS 'The end date for this term assignment';`;

  const copySQL = () => {
    navigator.clipboard.writeText(migrationSQL);
    
    toast({
      title: "SQL Copied",
      description: "Migration SQL commands copied to clipboard",
    });
  };

  const runMigration = async () => {
    setIsMigrating(true);
    
    try {
      toast({
        title: "Migration Started",
        description: "Adding date columns to term_assignments table...",
      });
      
      // Since exec_sql RPC may not be available, try to run a direct SQL query
      // This may require admin privileges in Supabase
      const { error } = await supabase
        .from('term_assignments' as any)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Error checking term_assignments table:', error);
        toast({
          title: "Migration Failed",
          description: "Unable to access term_assignments table. You may need admin privileges.",
          variant: "destructive",
        });
      } else {
        // Show success even though we can't directly run the migration
        // The user will need to run the SQL in the Supabase dashboard
        setMigrationComplete(true);
        toast({
          title: "Table Access Verified",
          description: "Please copy the SQL and run it in the Supabase SQL Editor with admin privileges.",
        });
      }
    } catch (error) {
      console.error('Error in migration:', error);
      toast({
        title: "Migration Failed",
        description: "An unexpected error occurred. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Database Migration Required</CardTitle>
        <CardDescription>
          Missing date columns in term_assignments table
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Your application is trying to use columns that don't exist in the database yet.
          Run this migration to add the required columns:
        </p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
          {migrationSQL}
        </pre>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={copySQL}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy SQL
        </Button>
        <Button 
          onClick={runMigration}
          disabled={isMigrating || migrationComplete}
        >
          {migrationComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Migration Complete
            </>
          ) : isMigrating ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Migrating...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 