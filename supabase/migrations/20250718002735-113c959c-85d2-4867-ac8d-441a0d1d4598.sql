-- Add missing notification types for supply requests
ALTER TABLE user_notifications 
DROP CONSTRAINT user_notifications_type_check;

ALTER TABLE user_notifications 
ADD CONSTRAINT user_notifications_type_check 
CHECK (type = ANY (ARRAY[
  'key_request_approved'::text, 
  'key_request_denied'::text, 
  'key_request_fulfilled'::text, 
  'new_assignment'::text, 
  'maintenance'::text, 
  'issue_update'::text,
  'supply_request_update'::text,
  'new_supply_request'::text,
  'key_order_update'::text
]));