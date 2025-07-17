-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.key_orders_view;

CREATE VIEW public.key_orders_view WITH (security_invoker = true) AS
SELECT ko.id,
    ko.key_id,
    ko.requestor_id,
    ko.recipient_id,
    ko.quantity,
    ko.ordered_at,
    ko.expected_delivery_date,
    ko.received_at,
    ko.notes,
    ko.created_at,
    ko.updated_at,
    ko.request_id,
    ko.user_id,
    ko.priority,
    ko.estimated_delivery_date,
    ko.tracking_number,
    ko.vendor_order_id,
    ko.cost,
    ko.delivery_notes,
    ko.status,
    kr.reason,
    kr.request_type,
    p.first_name,
    p.last_name,
    p.email
   FROM ((key_orders ko
     LEFT JOIN key_requests kr ON ((ko.request_id = kr.id)))
     LEFT JOIN profiles p ON ((ko.user_id = p.id)));