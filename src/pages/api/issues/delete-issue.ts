import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with server-side configuration
const supabaseUrl = "https://fmymhtuiqzhupjyopfvi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { issueId, force } = req.query;

  if (!issueId) {
    return res.status(400).json({ success: false, message: 'Issue ID is required' });
  }

  try {
    console.log(`API: Deleting issue with ID: ${issueId}${force ? ' (force mode)' : ''}`);

    // If force is true, we'll try to delete any related records first
    // Create a server-side Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (force === 'true') {
      console.log('Using force delete mode');

      try {
        // List of potential related tables to check and clean up
        const relatedTables = [
          'issue_comments',
          'issue_attachments',
          'issue_history',
          'issue_assignments',
          'issue_tags'
        ];

        // Process each related table
        for (const table of relatedTables) {
          try {
            console.log(`Checking for related records in ${table}...`);

            // Check if the table exists and has related records
            const { data: relatedData, error: relatedError } = await supabase
              .from(table)
              .select('id')
              .eq('issue_id', issueId);

            if (relatedError) {
              // If the table doesn't exist, this will error but we can ignore it
              if (relatedError.code === '42P01') { // Relation does not exist
                console.log(`Table ${table} does not exist, skipping`);
                continue;
              }

              console.log(`Error checking related records in ${table}:`, relatedError);
              continue;
            }

            if (relatedData && relatedData.length > 0) {
              console.log(`Found ${relatedData.length} related records in ${table}, attempting to delete`);

              // Delete related records
              const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .eq('issue_id', issueId);

              if (deleteError) {
                console.error(`Error deleting related records from ${table}:`, deleteError);
              } else {
                console.log(`Successfully deleted related records from ${table}`);
              }
            } else {
              console.log(`No related records found in ${table}`);
            }
          } catch (tableError) {
            console.error(`Error processing table ${table}:`, tableError);
          }
        }

        // Also check for any references in the issues table itself
        try {
          const { data: relatedIssues, error: relatedIssuesError } = await supabase
            .from('issues')
            .select('id')
            .eq('parent_issue_id', issueId);

          if (!relatedIssuesError && relatedIssues && relatedIssues.length > 0) {
            console.log(`Found ${relatedIssues.length} child issues, updating their parent reference`);

            const { error: updateError } = await supabase
              .from('issues')
              .update({ parent_issue_id: null })
              .eq('parent_issue_id', issueId);

            if (updateError) {
              console.error('Error updating child issues:', updateError);
            } else {
              console.log('Successfully updated child issues');
            }
          }
        } catch (relatedIssuesError) {
          console.error('Error checking for related issues:', relatedIssuesError);
        }
      } catch (error) {
        console.error('Error in force delete mode:', error);
      }
    }

    // We already created the Supabase client above

    // First, check if the issue exists
    const { data: issueData, error: issueCheckError } = await supabase
      .from('issues')
      .select('id')
      .eq('id', issueId)
      .single();

    if (issueCheckError) {
      if (issueCheckError.code === 'PGRST116') {
        // Issue not found
        return res.status(404).json({
          success: false,
          message: `Issue with ID ${issueId} not found`,
          error: issueCheckError
        });
      }

      console.error('Error checking issue existence:', issueCheckError);
      return res.status(500).json({
        success: false,
        message: `Error checking issue existence: ${issueCheckError.message}`,
        error: issueCheckError
      });
    }

    // Delete the issue
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (error) {
      console.error('Error deleting issue:', error);

      // Check for foreign key constraint violations
      if (error.code === '23503') {
        return res.status(409).json({
          success: false,
          message: `Cannot delete issue due to foreign key constraints. Use force=true to attempt to delete related records first.`,
          error,
          requiresForce: true
        });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to delete issue: ${error.message}`,
        error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in delete-issue API:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred',
      error
    });
  }
}
