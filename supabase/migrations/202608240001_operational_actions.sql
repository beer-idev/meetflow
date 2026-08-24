-- Operational support for real UI actions.
-- Forward-only migration: keep user lookup and audit writes behind RLS/RPC.

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is distinct from u.email;

create unique index if not exists profiles_email_idx
  on public.profiles (lower(email))
  where email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

create policy "members insert audit logs"
on public.audit_logs
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and private.has_org_role(
    organization_id,
    array['admin','chair','reporter','reviewer','participant']::public.app_role[]
  )
);

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

  select id into v_user_id
  from auth.users
  where lower(auth.users.email) = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception 'user_not_found';
  end if;

  insert into public.profiles (id, display_name, email)
  select u.id, coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)), u.email
  from auth.users as u
  where u.id = v_user_id
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  insert into public.memberships (organization_id, user_id, role)
  values (p_organization_id, v_user_id, p_role)
  on conflict on constraint memberships_pkey do update set role = excluded.role;

  return query
  select p.id, p.display_name, p.email, m.role
  from public.memberships m
  join public.profiles p on p.id = m.user_id
  where m.organization_id = p_organization_id and m.user_id = v_user_id;
end;
$$;

grant execute on function public.add_member_by_email(uuid, text, public.app_role) to authenticated;
