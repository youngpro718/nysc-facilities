import { supabase } from '@/lib/supabase';

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  matched_records: {
    room?: { id: string; room_number: string };
    user?: { id: string; email: string; name: string };
    items?: Array<{ id: string; name: string; match_confidence: number }>;
  };
}

export async function validateKeyRequestData(data: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    matched_records: {},
  };

  // Validate required fields
  if (!data.request_type) {
    result.errors.push({ field: 'request_type', message: 'Request type is required' });
    result.isValid = false;
  }

  if (!data.reason || data.reason.trim().length < 10) {
    result.errors.push({ field: 'reason', message: 'Please provide a detailed reason (at least 10 characters)' });
    result.isValid = false;
  }

  if (!data.quantity || data.quantity < 1) {
    result.errors.push({ field: 'quantity', message: 'Quantity must be at least 1' });
    result.isValid = false;
  }

  // Validate room number if provided
  if (data.room_number) {
    const { data: room } = await supabase
      .from('court_rooms')
      .select('id, room_number')
      .eq('room_number', data.room_number)
      .single();

    if (room) {
      result.matched_records.room = room;
    } else {
      result.warnings.push({
        field: 'room_number',
        message: `Room ${data.room_number} not found in system. Please verify.`,
      });
    }
  }

  // Validate email format if provided
  if (data.requestor_email && !isValidEmail(data.requestor_email)) {
    result.errors.push({ field: 'requestor_email', message: 'Invalid email format' });
    result.isValid = false;
  }

  return result;
}

export async function validateSupplyRequestData(data: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    matched_records: {},
  };

  // Validate required fields
  if (!data.title || data.title.trim().length === 0) {
    result.errors.push({ field: 'title', message: 'Title is required' });
    result.isValid = false;
  }

  if (!data.justification || data.justification.trim().length < 20) {
    result.errors.push({ field: 'justification', message: 'Please provide detailed justification (at least 20 characters)' });
    result.isValid = false;
  }

  if (!data.priority) {
    result.errors.push({ field: 'priority', message: 'Priority is required' });
    result.isValid = false;
  }

  if (!data.items || data.items.length === 0) {
    result.errors.push({ field: 'items', message: 'At least one item is required' });
    result.isValid = false;
  } else {
    // Try to match items with inventory
    const matchedItems = [];
    for (const item of data.items) {
      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('id, name')
        .ilike('name', `%${item.item_name}%`)
        .limit(1);

      if (inventoryItems && inventoryItems.length > 0) {
        matchedItems.push({
          ...inventoryItems[0],
          match_confidence: 0.8,
        });
      }
    }
    if (matchedItems.length > 0) {
      result.matched_records.items = matchedItems;
    }
  }

  // Validate email format if provided
  if (data.requestor_email && !isValidEmail(data.requestor_email)) {
    result.errors.push({ field: 'requestor_email', message: 'Invalid email format' });
    result.isValid = false;
  }

  return result;
}

export async function validateMaintenanceRequestData(data: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    matched_records: {},
  };

  // Validate required fields
  if (!data.title || data.title.trim().length === 0) {
    result.errors.push({ field: 'title', message: 'Title is required' });
    result.isValid = false;
  }

  if (!data.description || data.description.trim().length < 20) {
    result.errors.push({ field: 'description', message: 'Please provide detailed description (at least 20 characters)' });
    result.isValid = false;
  }

  if (!data.priority) {
    result.errors.push({ field: 'priority', message: 'Priority is required' });
    result.isValid = false;
  }

  // Validate room number if provided
  if (data.room_number) {
    const { data: room } = await supabase
      .from('court_rooms')
      .select('id, room_number')
      .eq('room_number', data.room_number)
      .single();

    if (room) {
      result.matched_records.room = room;
    } else {
      result.warnings.push({
        field: 'room_number',
        message: `Room ${data.room_number} not found in system.`,
      });
    }
  }

  return result;
}

export async function validateIssueReportData(data: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    matched_records: {},
  };

  // Validate required fields
  if (!data.issue_type || data.issue_type.trim().length === 0) {
    result.errors.push({ field: 'issue_type', message: 'Issue type is required' });
    result.isValid = false;
  }

  if (!data.description || data.description.trim().length < 20) {
    result.errors.push({ field: 'description', message: 'Please provide detailed description (at least 20 characters)' });
    result.isValid = false;
  }

  if (!data.location_description || data.location_description.trim().length === 0) {
    result.errors.push({ field: 'location_description', message: 'Location is required' });
    result.isValid = false;
  }

  return result;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
