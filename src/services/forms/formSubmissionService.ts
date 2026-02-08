import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { submitKeyRequest } from '@/services/keyRequestService';
import type {
  FormSubmissionResult,
  KeyRequestFormData,
  SupplyRequestFormData,
  MaintenanceRequestFormData,
  IssueReportFormData,
  UserProfileRef,
} from '@/types/forms';

export async function createKeyRequestFromForm(
  formData: KeyRequestFormData,
  userId: string,
  submissionId: string
): Promise<FormSubmissionResult> {
  try {
    // Try to find or create user profile
    let userProfile = await findUserByEmail(formData.requestor_email);
    const targetUserId = userProfile?.id || userId;

    // Find room ID if room number provided
    let roomId = null;
    if (formData.room_number) {
      const { data: room } = await supabase
        .from('court_rooms')
        .select('id, room_id')
        .eq('room_number', formData.room_number)
        .single();
      
      if (room) {
        roomId = room.room_id;
      }
    }

    // Create key request
    await submitKeyRequest({
      reason: formData.reason,
      user_id: targetUserId,
      request_type: formData.request_type,
      room_id: roomId || undefined,
      room_other: formData.room_other || null,
      quantity: formData.quantity,
      emergency_contact: formData.emergency_contact || null,
      email_notifications_enabled: !!formData.requestor_email,
    });

    // Update form submission with link
    await supabase
      .from('form_submissions')
      .update({
        linked_request_type: 'key_request',
        processing_status: 'completed',
      })
      .eq('id', submissionId);

    return { success: true };
  } catch (error) {
    logger.error('Error creating key request from form:', error);
    return { success: false, error: error.message };
  }
}

export async function createSupplyRequestFromForm(
  formData: SupplyRequestFormData,
  userId: string,
  submissionId: string
): Promise<FormSubmissionResult> {
  try {
    let userProfile = await findUserByEmail(formData.requestor_email);
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
      const items = formData.items.map((item: Record<string, unknown>) => ({
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
    return { success: false, error: error.message };
  }
}

export async function createMaintenanceRequestFromForm(
  formData: MaintenanceRequestFormData,
  userId: string,
  submissionId: string
): Promise<FormSubmissionResult> {
  try {
    let userProfile = await findUserByEmail(formData.requestor_email);
    const targetUserId = userProfile?.id || userId;

    // Find room if specified
    let roomId = null;
    if (formData.room_number) {
      const { data: room } = await supabase
        .from('court_rooms')
        .select('id')
        .eq('room_number', formData.room_number)
        .single();
      
      if (room) roomId = room.id;
    }

    // Create maintenance request
    const { data: request, error: requestError } = await supabase
      .from('maintenance_requests')
      .insert({
        user_id: targetUserId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'pending',
        room_id: roomId,
        scheduled_date: formData.scheduled_date || null,
        work_type: formData.work_type || 'general',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Update form submission
    await supabase
      .from('form_submissions')
      .update({
        linked_request_id: request.id,
        linked_request_type: 'maintenance_request',
        processing_status: 'completed',
      })
      .eq('id', submissionId);

    return { success: true, requestId: request.id };
  } catch (error) {
    logger.error('Error creating maintenance request from form:', error);
    return { success: false, error: error.message };
  }
}

export async function createIssueFromForm(
  formData: IssueReportFormData,
  userId: string,
  submissionId: string
): Promise<FormSubmissionResult> {
  try {
    let userProfile = await findUserByEmail(formData.requestor_email);
    const targetUserId = userProfile?.id || userId;

    // Create issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        user_id: targetUserId,
        title: formData.title || `${formData.issue_type} - ${formData.location_description}`,
        description: formData.description,
        issue_type: formData.issue_type,
        priority: formData.priority,
        status: 'open',
        location_description: formData.location_description,
        severity: formData.severity || 'medium',
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
    return { success: false, error: error.message };
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
