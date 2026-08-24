-- Avoid PL/pgSQL resolving `user_id` as the table-returning output variable
-- when the memberships primary key is used as an upsert target.
create or replace function public.add_member_by_email(
  p_organization_id uuid,
  p_email text,
  p_role public.app_role default 'participant'
)
returns table (
  user_id uuid,
  display_name text,
  email text,
  role public.app_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not private.has_org_role(p_organization_id, array['admin']::public.app_role[]) then
    raise exception 'not_allowed';
  end if;

  select u.id into v_user_id
  from auth.users as u
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception 'user_not_found';
  end if;

  insert into public.profiles (id, display_name, email)
  select u.id,
    coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
    u.email
  from auth.users as u
  where u.id = v_user_id
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  insert into public.memberships (organization_id, user_id, role)
  values (p_organization_id, v_user_id, p_role)
  on conflict on constraint memberships_pkey do update
    set role = excluded.role;

  return query
  select p.id, p.display_name, p.email, m.role
  from public.memberships as m
  join public.profiles as p on p.id = m.user_id
  where m.organization_id = p_organization_id
    and m.user_id = v_user_id;
end;
$$;

grant execute on function public.add_member_by_email(uuid, text, public.app_role) to authenticated;
