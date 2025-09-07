import { supabase } from "@/lib/supabase";

// Service to integrate lighting issues with operations issue tracking
export class LightingOperationsIntegration {
  
  // Create an operations issue when a lighting issue is reported
  static async createOperationsIssue(lightingIssueData: {
    fixtureId: string;
    fixtureName: string;
    issueType: string;
    location: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    reportedBy: string;
  }) {
    try {
      // Create issue in operations system - simplified for current schema
      const { data: issue, error } = await supabase
        .from('issues')
        .insert({
          title: `Lighting: ${lightingIssueData.fixtureName}`,
          description: `${lightingIssueData.description}\n\nFixture: ${lightingIssueData.fixtureName}\nLocation: ${lightingIssueData.location}\nIssue Type: ${lightingIssueData.issueType}`,
          issue_type: 'lighting',
          priority: lightingIssueData.priority === 'critical' ? 'high' : lightingIssueData.priority,
          status: 'open',
          created_by: lightingIssueData.reportedBy
        })
        .select()
        .single();

      if (error) throw error;

      return issue;
    } catch (error) {
      console.error('Failed to create operations issue:', error);
      throw error;
    }
  }

  // Update operations issue when lighting issue status changes
  static async syncLightingStatusToOperations(fixtureId: string, newStatus: string) {
    try {
      // Find operations issues related to this fixture
      const { data: issues, error } = await supabase
        .from('issues')
        .select('id, status')
        .ilike('description', `%${fixtureId}%`)
        .neq('status', 'resolved');

      if (error || !issues?.length) return;

      // Map lighting status to operations status
      const operationsStatus = this.mapLightingStatusToOperations(newStatus);
      
      // Update related operations issues
      await supabase
        .from('issues')
        .update({
          status: operationsStatus as 'open' | 'in_progress' | 'resolved',
          updated_at: new Date().toISOString()
        })
        .in('id', issues.map(i => i.id));

    } catch (error) {
      console.error('Failed to sync lighting status to operations:', error);
      throw error;
    }
  }

  // Map lighting fixture status to operations issue status
  private static mapLightingStatusToOperations(lightingStatus: string): string {
    switch (lightingStatus) {
      case 'functional':
        return 'resolved';
      case 'non_functional':
        return 'open';
      case 'maintenance_needed':
        return 'in_progress';
      case 'scheduled_replacement':
        return 'pending';
      default:
        return 'open';
    }
  }

  // Get lighting-related operations issues
  static async getLightingOperationsIssues() {
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .ilike('title', '%Lighting Issue%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return issues;
    } catch (error) {
      console.error('Failed to fetch lighting operations issues:', error);
      throw error;
    }
  }

  // Get operations issues for a specific fixture
  static async getFixtureOperationsIssues(fixtureId: string) {
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .ilike('description', `%${fixtureId}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return issues || [];
    } catch (error) {
      console.error('Failed to fetch fixture operations issues:', error);
      throw error;
    }
  }
}