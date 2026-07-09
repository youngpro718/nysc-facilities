-- 099_key_request_notifications.sql
-- Approving/rejecting/etc. a key request (key_requests.status change, done
-- from /keys Requests tab) created NO user_notifications row for the
-- requester — staff_tasks has trg_notify_user_on_staff_task_update for the
-- equivalent flow, but key_requests had zero non-internal triggers at all
-- (confirmed via pg_trigger).
--
-- Mirrors the staff_tasks pattern (notify_user_on_staff_task_update): a
-- SECURITY DEFINER AFTER UPDATE OF status trigger inserts into
-- user_notifications for the requester whenever status actually changes.
-- Covers approved/rejected/ready (the minimum asked for) plus
-- fulfilled/cancelled for completeness, matching the staff_tasks coverage.
--
-- user_notifications_type_check already reserved 'key_request_approved',
-- 'key_request_denied', 'key_request_fulfilled' (never wired up to any
-- trigger) — reused here for those three statuses. 'ready'/'cancelled'/
-- anything else fall back to a new 'key_request_update' type, added to the
-- constraint below.

alter table public.user_notifications drop constraint user_notifications_type_check;
alter table public.user_notifications add constraint user_notifications_type_check
  check (type = ANY (ARRAY[
    'key_request_approved'::text, 'key_request_denied'::text, 'key_request_fulfilled'::text,
    'key_request_update'::text,
    'new_assignment'::text, 'maintenance'::text, 'issue_update'::text,
    'supply_request_update'::text, 'new_supply_request'::text, 'key_order_update'::text,
    'staff_task_pending'::text, 'staff_task_update'::text, 'supply_request_status_change'::text,
    'supply_request_priority_change'::text, 'supply_request_assigned'::text, 'supply_completed'::text,
    'supply_request_completed'::text, 'supply_request_rejected'::text
  ]));

create or replace function public.notify_user_on_key_request_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  room_label text;
begin
  if old.status is distinct from new.status then
    select nullif(trim(concat_ws(' — ', 'Room ' || r.room_number, r.name)), '')
    into room_label
    from public.rooms r
    where r.id = new.room_id;

    room_label := coalesce(room_label, new.room_other, 'your requested room');

    insert into public.user_notifications (
      user_id, type, title, message, urgency, action_url, related_id
    )
    values (
      new.user_id,
      case
        when new.status = 'approved' then 'key_request_approved'
        when new.status = 'rejected' then 'key_request_denied'
        when new.status = 'fulfilled' then 'key_request_fulfilled'
        else 'key_request_update'
      end,
      case
        when new.status = 'approved' then 'Key request approved'
        when new.status = 'rejected' then 'Key request rejected'
        when new.status = 'ready' then 'Key ready for pickup'
        when new.status = 'fulfilled' then 'Key request fulfilled'
        when new.status = 'cancelled' then 'Key request cancelled'
        else 'Key request updated'
      end,
      case
        when new.status = 'approved' then
          format('Your request for %s key(s) for %s was approved.', new.quantity, room_label)
        when new.status = 'rejected' then
          format('Your request for %s key(s) for %s was rejected%s.',
                 new.quantity, room_label,
                 case when new.rejection_reason is not null and trim(new.rejection_reason) <> ''
                      then ' — ' || new.rejection_reason
                      else '' end)
        when new.status = 'ready' then
          format('%s key(s) for %s are ready for pickup.', new.quantity, room_label)
        when new.status = 'fulfilled' then
          format('%s key(s) for %s have been handed out.', new.quantity, room_label)
        when new.status = 'cancelled' then
          format('Your request for %s key(s) for %s was cancelled.', new.quantity, room_label)
        else
          format('Your key request for %s — status updated to %s.', room_label, new.status)
      end,
      case when new.status = 'rejected' then 'high' else 'medium' end,
      '/keys?focus=' || new.id,
      new.id
    );
  end if;
  return new;
end;
$function$;

create trigger trg_notify_user_on_key_request_update
after update of status on public.key_requests
for each row execute function public.notify_user_on_key_request_update();
