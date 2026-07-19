-- 112: Cut notification noise + fix the deep link.
--
-- Audit 2026-07-19 found 83 unread user notifications (56 of them
-- supply_request_update) because every status hop of every order wrote a row.
-- The requester now only gets notified at moments that matter to them:
--   pending_approval (their order is blocked), approved, ready (action!),
--   rejected, completed, cancelled.
-- Intermediate warehouse hops (under_review, received, picking, misc) no
-- longer notify — they still land in supply_request_status_history, which is
-- unchanged and records EVERY transition.
-- Also: action_url now points at /my-requests (the old /request/supplies
-- redirects to the order-a-new-item tab, which is the wrong place to send
-- someone whose existing order changed).

create or replace function public.notify_supply_request_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_title text;
  v_message text;
  v_urgency text := 'medium';
  v_notify boolean := true;
begin
  if old.status = new.status then
    return new;
  end if;

  case new.status
    when 'fulfilled' then
      v_notify := false;
    when 'under_review' then
      v_notify := false;
    when 'received' then
      v_notify := false;
    when 'picking' then
      v_notify := false;
    when 'pending_approval' then
      v_title := 'Supply Request Needs Approval';
      v_message := 'Request "' || coalesce(new.title, 'Untitled') || '" requires approval for restricted items.';
      v_urgency := 'high';
    when 'approved' then
      v_title := 'Supply Request Approved';
      v_message := 'Your request "' || coalesce(new.title, 'Untitled') || '" has been approved.';
    when 'rejected' then
      v_title := 'Supply Request Rejected';
      v_message := 'Your request "' || coalesce(new.title, 'Untitled') || '" was rejected. Reason: ' || coalesce(new.rejection_reason, 'Not specified');
      v_urgency := 'high';
    when 'ready' then
      v_title := 'Order Ready for Pickup!';
      v_message := 'Your order "' || coalesce(new.title, 'Untitled') || '" is ready. Please pick up from the supply room.';
      v_urgency := 'high';
    when 'completed' then
      v_title := 'Order Completed';
      v_message := 'Your order "' || coalesce(new.title, 'Untitled') || '" has been completed.';
    when 'cancelled' then
      v_title := 'Order Cancelled';
      v_message := 'Your order "' || coalesce(new.title, 'Untitled') || '" has been cancelled.';
    else
      -- Unknown/rare transitions: keep history, skip the notification.
      v_notify := false;
  end case;

  if v_notify then
    insert into public.user_notifications (
      user_id, type, title, message, urgency, action_url, related_id, metadata
    ) values (
      new.requester_id,
      'supply_request_update',
      v_title,
      v_message,
      v_urgency,
      '/my-requests',
      new.id,
      jsonb_build_object('status', new.status, 'previous_status', old.status)
    );
  end if;

  insert into public.supply_request_status_history (
    request_id, status, notes, changed_by, changed_at
  ) values (
    new.id,
    new.status,
    case
      when new.status = 'rejected' then new.rejection_reason
      when new.status = 'approved' then new.approval_notes
      else null
    end,
    coalesce(auth.uid(), new.approved_by, new.fulfilled_by),
    now()
  );

  return new;
end;
$function$;

-- One-time hygiene: notifications older than 45 days that were never read are
-- stale by definition (the February task-pending pile). Mark them read so the
-- unread count means something again.
update public.user_notifications
   set read = true
 where read = false
   and created_at < now() - interval '45 days';
