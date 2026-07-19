-- 111: Signups no longer choose a role.
--
-- Product decision 2026-07-19: the signup form's role picker is removed.
-- Every new account gets the 'standard' role; admins assign real roles from
-- Admin Center afterwards. Two functions changed:
--
-- 1. handle_new_user (auth.users AFTER INSERT trigger fn): previously wrote
--    whatever raw_user_meta_data->>'requested_role' said straight into
--    user_roles (court_officer, purchasing, ... — before any approval).
--    Now always assigns 'standard'. requested_role is still stored on the
--    profile for the admin review screen, but grants nothing.
--
-- 2. handle_trusted_signup: previously auto-approved trusted-domain signups
--    (nycourts.gov) AND auto-assigned the domain's auto_role (court_officer).
--    Now it still auto-VERIFIES/approves the account (identity check) but
--    leaves the role as 'standard'; the requested-role mismatch bail-out is
--    gone since there is nothing to mismatch.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_department_id uuid;
  v_requested_role text;
begin
  v_first_name := coalesce(new.raw_user_meta_data->>'first_name', '');
  v_last_name  := coalesce(new.raw_user_meta_data->>'last_name', '');
  v_full_name  := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', v_first_name || ' ' || v_last_name)), '');

  begin
    v_department_id := (new.raw_user_meta_data->>'department_id')::uuid;
  exception when others then
    v_department_id := null;
  end;

  v_requested_role := nullif(trim(lower(new.raw_user_meta_data->>'requested_role')), '');

  -- Profile creation — never block signup on failure
  begin
    delete from public.profiles p
    where p.email = new.email
      and p.id <> new.id
      and not exists (select 1 from auth.users u where u.id = p.id);

    insert into public.profiles (
      id, email, first_name, last_name, full_name, title, phone,
      department_id, department, room_number, court_position,
      emergency_contact, requested_role,
      verification_status, is_approved, access_level,
      onboarded, onboarding_completed, mfa_enforced,
      created_at, updated_at
    )
    values (
      new.id, new.email, v_first_name, v_last_name, v_full_name,
      new.raw_user_meta_data->>'title',
      new.raw_user_meta_data->>'phone',
      v_department_id,
      new.raw_user_meta_data->>'department',
      new.raw_user_meta_data->>'room_number',
      new.raw_user_meta_data->>'court_position',
      case
        when new.raw_user_meta_data->>'emergency_contact' is not null
        then (new.raw_user_meta_data->>'emergency_contact')::jsonb
        else null
      end,
      v_requested_role,
      'pending', false, 'none', false, false, false, now(), now()
    )
    on conflict (id) do update set
      email = excluded.email,
      first_name = coalesce(excluded.first_name, profiles.first_name),
      last_name  = coalesce(excluded.last_name, profiles.last_name),
      full_name  = coalesce(excluded.full_name, profiles.full_name),
      title      = coalesce(excluded.title, profiles.title),
      phone      = coalesce(excluded.phone, profiles.phone),
      department_id = coalesce(excluded.department_id, profiles.department_id),
      room_number   = coalesce(excluded.room_number, profiles.room_number),
      court_position = coalesce(excluded.court_position, profiles.court_position),
      requested_role = coalesce(excluded.requested_role, profiles.requested_role),
      updated_at = now();
  exception when others then
    raise warning 'handle_new_user: profile insert failed for % (%) — SQLSTATE % %', new.id, new.email, sqlstate, sqlerrm;
  end;

  -- Role assignment — ALWAYS standard; admins promote via Admin Center.
  begin
    insert into public.user_roles (user_id, role)
    values (new.id, 'standard'::public.user_role)
    on conflict (user_id) do update
      set role = excluded.role,
          updated_at = now();
  exception when others then
    raise warning 'handle_new_user: role insert failed for % — SQLSTATE % %', new.id, sqlstate, sqlerrm;
  end;

  return new;
end;
$function$;

create or replace function public.handle_trusted_signup(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email text;
  v_domain text;
begin
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then return; end if;

  v_domain := lower(split_part(v_email, '@', 2));
  if v_domain = '' then return; end if;

  -- Trusted domain = identity is considered verified; role stays 'standard'.
  if not exists (
    select 1 from public.trusted_email_domains
    where lower(domain) = v_domain
  ) then
    return;
  end if;

  update public.profiles
     set verification_status = 'verified',
         is_approved = true,
         updated_at = now()
   where id = p_user_id;

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'standard'::public.user_role)
  on conflict (user_id) do update
    set role = excluded.role,
        updated_at = now();

  -- Best-effort admin notification; never abort signup on failure.
  begin
    insert into public.admin_notifications (
      notification_type, urgency, title, message, related_user_id, metadata
    ) values (
      'auto_approved_signup',
      'low',
      'Trusted-domain signup auto-verified',
      format('%s was auto-verified via %s and joined as a standard user — assign a role in Admin Center if needed', v_email, v_domain),
      p_user_id,
      jsonb_build_object('email', v_email, 'domain', v_domain, 'role', 'standard')
    );
  exception when others then
    raise warning 'handle_trusted_signup: admin_notifications insert failed: %', sqlerrm;
  end;
end;
$function$;
