create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'chair', 'reporter', 'reviewer', 'participant');
create type public.meeting_status as enum ('draft', 'scheduled', 'completed', 'cancelled');
create type public.report_status as enum ('draft', 'in_review', 'approved', 'published');
create type public.access_level as enum ('view', 'edit', 'manage');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'participant',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 240),
  meeting_type text not null default 'ประชุมภายใน',
  description text,
  meeting_date date not null,
  start_time time not null,
  end_time time,
  location text not null,
  status public.meeting_status not null default 'scheduled',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(location, '')), 'C')
  ) stored
);

create table public.meeting_participants (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attendance_status text not null default 'invited' check (attendance_status in ('invited', 'accepted', 'declined', 'attended', 'absent')),
  primary key (meeting_id, user_id)
);

create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  detail text,
  presenter_id uuid references auth.users(id),
  resolution text,
  unique (meeting_id, position)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings(id) on delete cascade,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  plain_text text not null default '',
  status public.report_status not null default 'draft',
  version integer not null default 1,
  prepared_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (to_tsvector('simple', coalesce(plain_text, ''))) stored
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (meeting_id is not null or report_id is not null)
);

create table public.document_permissions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access public.access_level not null default 'view',
  granted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (meeting_id, user_id)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index meetings_org_date_idx on public.meetings (organization_id, meeting_date desc);
create index meetings_search_idx on public.meetings using gin (search_vector);
create index meetings_title_trgm_idx on public.meetings using gin (title gin_trgm_ops);
create index reports_search_idx on public.reports using gin (search_vector);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

create schema if not exists private;
create or replace function private.has_org_role(org_id uuid, allowed_roles public.app_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from memberships where organization_id = org_id and user_id = auth.uid() and role = any(allowed_roles)); $$;

create or replace function private.can_access_meeting(target_meeting_id uuid, minimum_access public.access_level default 'view')
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from meetings m
    where m.id = target_meeting_id and (
      private.has_org_role(m.organization_id, array['admin','chair','reporter','reviewer']::app_role[])
      or exists (select 1 from meeting_participants p where p.meeting_id = m.id and p.user_id = auth.uid())
      or exists (select 1 from document_permissions d where d.meeting_id = m.id and d.user_id = auth.uid()
        and case minimum_access when 'view' then true when 'edit' then d.access in ('edit','manage') when 'manage' then d.access = 'manage' end)
    )
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.agenda_items enable row level security;
alter table public.reports enable row level security;
alter table public.attachments enable row level security;
alter table public.document_permissions enable row level security;
alter table public.share_links enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles visible to signed in users" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members view organizations" on public.organizations for select to authenticated using (private.has_org_role(id, array['admin','chair','reporter','reviewer','participant']::app_role[]));
create policy "members view memberships" on public.memberships for select to authenticated using (private.has_org_role(organization_id, array['admin','chair','reporter','reviewer','participant']::app_role[]));
create policy "admins manage memberships" on public.memberships for all to authenticated using (private.has_org_role(organization_id, array['admin']::app_role[])) with check (private.has_org_role(organization_id, array['admin']::app_role[]));

create policy "authorized users view meetings" on public.meetings for select to authenticated using (private.can_access_meeting(id));
create policy "staff create meetings" on public.meetings for insert to authenticated with check (created_by = auth.uid() and private.has_org_role(organization_id, array['admin','chair','reporter']::app_role[]));
create policy "staff update meetings" on public.meetings for update to authenticated using (private.has_org_role(organization_id, array['admin','chair','reporter']::app_role[])) with check (private.has_org_role(organization_id, array['admin','chair','reporter']::app_role[]));
create policy "admins delete meetings" on public.meetings for delete to authenticated using (private.has_org_role(organization_id, array['admin']::app_role[]));

create policy "meeting users view participants" on public.meeting_participants for select to authenticated using (private.can_access_meeting(meeting_id));
create policy "meeting managers manage participants" on public.meeting_participants for all to authenticated using (private.can_access_meeting(meeting_id, 'manage')) with check (private.can_access_meeting(meeting_id, 'manage'));
create policy "meeting users view agendas" on public.agenda_items for select to authenticated using (private.can_access_meeting(meeting_id));
create policy "editors manage agendas" on public.agenda_items for all to authenticated using (private.can_access_meeting(meeting_id, 'edit')) with check (private.can_access_meeting(meeting_id, 'edit'));
create policy "meeting users view reports" on public.reports for select to authenticated using (private.can_access_meeting(meeting_id));
create policy "reporters manage reports" on public.reports for all to authenticated using (private.can_access_meeting(meeting_id, 'edit')) with check (private.can_access_meeting(meeting_id, 'edit'));
create policy "organization members view attachments" on public.attachments for select to authenticated using (private.has_org_role(organization_id, array['admin','chair','reporter','reviewer','participant']::app_role[]));
create policy "staff manage attachments" on public.attachments for all to authenticated using (private.has_org_role(organization_id, array['admin','chair','reporter']::app_role[])) with check (private.has_org_role(organization_id, array['admin','chair','reporter']::app_role[]));
create policy "meeting managers manage permissions" on public.document_permissions for all to authenticated using (private.can_access_meeting(meeting_id, 'manage')) with check (private.can_access_meeting(meeting_id, 'manage'));
create policy "meeting managers manage share links" on public.share_links for all to authenticated using (private.can_access_meeting(meeting_id, 'manage')) with check (private.can_access_meeting(meeting_id, 'manage'));
create policy "admins view audit logs" on public.audit_logs for select to authenticated using (private.has_org_role(organization_id, array['admin']::app_role[]));

insert into storage.buckets (id, name, public, file_size_limit)
values ('meeting-files', 'meeting-files', false, 52428800)
on conflict (id) do nothing;

create policy "members read meeting files" on storage.objects for select to authenticated
using (bucket_id = 'meeting-files' and private.has_org_role((storage.foldername(name))[1]::uuid, array['admin','chair','reporter','reviewer','participant']::app_role[]));
create policy "staff upload meeting files" on storage.objects for insert to authenticated
with check (bucket_id = 'meeting-files' and private.has_org_role((storage.foldername(name))[1]::uuid, array['admin','chair','reporter']::app_role[]));
create policy "staff update meeting files" on storage.objects for update to authenticated
using (bucket_id = 'meeting-files' and private.has_org_role((storage.foldername(name))[1]::uuid, array['admin','chair','reporter']::app_role[]));
create policy "admins delete meeting files" on storage.objects for delete to authenticated
using (bucket_id = 'meeting-files' and private.has_org_role((storage.foldername(name))[1]::uuid, array['admin']::app_role[]));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
