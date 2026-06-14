import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errorUtils';
import type {
  FormSubmissionResult,
  SupplyRequestFormData,
  MaintenanceRequestFormData,
  IssueReportFormData,
  UserProfileRef,
} from '@features/forms/types/forms';

export async function createSupplyRequestFromForm(
  formData: SupplyRequestFormData,
  userId: string,
  submissionId: string
): Promise<FormSubmissionResult> {
  try {
    const userProfile = await findUserByEmail(formData.requestor_email);
    const targetUserId = userProfile?.id || userId;

    // Create supply request
    const { data: request, error: requestError } = await supabase
      .from('supply_requests')
      .insert({
        user_id: targetUserId,
        title: formData.title,
        description: formData.description || '',
        justification: formData.justification,
        priority: formData.priority,
        status: 'pending',
        notes: formData.delivery_location ? `Delivery Location: ${formData.delivery_location}` : null,
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Create supply request items
    if (formData.items && formData.items.length > 0) {
      const items = formData.items.map((item: any) => ({
        request_id: request.id,
        item_name: item.item_name,
        quantity_requested: item.quantity,
        notes: item.notes || null,
      }));

      await supabase.from('supply_request_items').insert(items);
    }

    // Add to status history
    await supabase.from('supply_request_status_history').insert({
      request_id: request.id,
      status: 'pending',
      changed_by: targetUserId,
    });

    // Update form submission
    await supabase
      .from('form_submissions')
      .update({
        linked_request_id: request.id,
        linked_request_type: 'supply_request',
        processing_status: 'completed',
      })
      .eq('id', submissionId);

    return { success: true, requestId: request.id };
  } catch (error) {
    logger.error('Error creating supply request from form:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createMaintenanceRequestFromForm(
  formData: MaintenanceRequestFormData,
  userId: string,
  submissionId: string
): Promise<FormSubmissionResult> {
  try {
    const userProfile = await findUserByEmail(formData.requestor_email);
    const targetUserId = userProfile?.id || userId;

    // Map the form's work type to a standardized issue category so it filters
    // and reports like any other issue.
    const WORK_TYPE_TO_ISSUE_TYPE: Record<string, string> = {
      plumbing: 'PLUMBING_NEEDS',
      electrical: 'ELECTRICAL_NEEDS',
      hvac: 'CLIMATE_CONTROL',
      carpentry: 'FURNITURE_REPAIR',
      painting: 'STRUCTURAL_REPAIR',
      general: 'GENERAL_REQUESTS',
      other: 'GENERAL_REQUESTS',
    };
    const issueType = WORK_TYPE_TO_ISSUE_TYPE[formData.work_type || 'general'] || 'GENERAL_REQUESTS';

    // Form priorities ('urgent'/'emergency') map onto the issue priority enum.
    const PRIORITY_MAP: Record<string, string> = {
      low: 'low', medium: 'medium', high: 'high', urgent: 'critical', emergency: 'critical',
    };
    const priority = PRIORITY_MAP[formData.priority] || 'medium';

    // Create the issue. issues.room_id references unified_spaces, so we keep the
    // free-text room number in location_description rather than guessing an id.
    const locationParts = [formData.room_number, formData.work_type ? `Work type: ${formData.work_type}` : null]
      .filter(Boolean);
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        title: formData.title,
        description: formData.description,
        issue_type: issueType,
        priority,
        status: 'open',
        location_description: locationParts.join(' · ') || null,
        seen: false,
        reported_by: targetUserId,
        created_by: userId,
      })
      .select()
      .single();

    if (issueError) throw issueError;

    // Update form submission
    await supabase
      .from('form_submissions')
      .update({
        linked_request_id: issue.id,
        linked_request_type: 'issue',
        processing_status: 'completed',
      })
      .eq('id', submissionId);

    return { success: true, requestId: issue.id };
  } catch (error) {
    logger.error('Error creating maintenance request from form:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createIssueFromForm(
  formData: IssueReportFormData,
  userId: string,
  submissionId: string
): Promise<FormSubmissionResult> {
  try {
    const userProfile = await findUserByEmail(formData.requestor_email);
    const targetUserId = userProfile?.id || userId;

    // Create issue. issues uses reported_by/created_by (no user_id/severity column).
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        title: formData.title || `${formData.issue_type} - ${formData.location_description}`,
        description: formData.description,
        issue_type: formData.issue_type,
        priority: formData.priority,
        status: 'open',
        location_description: formData.location_description,
        seen: false,
        reported_by: targetUserId,
        created_by: userId,
      })
      .select()
      .single();

    if (issueError) throw issueError;

    // Update form submission
    await supabase
      .from('form_submissions')
      .update({
        linked_request_id: issue.id,
        linked_request_type: 'issue',
        processing_status: 'completed',
      })
      .eq('id', submissionId);

    return { success: true, requestId: issue.id };
  } catch (error) {
    logger.error('Error creating issue from form:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

async function findUserByEmail(email: string): Promise<UserProfileRef | null> {
  if (!email) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('email', email.toLowerCase())
    .single();

  return data;
}
