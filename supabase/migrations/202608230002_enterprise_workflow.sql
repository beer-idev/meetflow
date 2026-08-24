-- Organization structure and document classification
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  parent_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table public.meetings add column department_id uuid references public.departments(id) on delete set null;
alter table public.attachments add column category text not null default 'supporting_document';
alter table public.attachments add column document_date date;

create index departments_organization_idx on public.departments (organization_id, name);
create index meetings_filter_idx on public.meetings (organization_id, department_id, meeting_type, meeting_date desc);
create index attachments_category_date_idx on public.attachments (organization_id, category, document_date desc);

-- Immutable snapshots and human review history
create table public.report_versions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  version_number integer not null,
  content jsonb not null,
  plain_text text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (report_id, version_number)
);

create table public.report_reviews (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('comment', 'changes_requested', 'approved')),
  comment text,
  created_at timestamptz not null default now()
);

create index report_versions_report_idx on public.report_versions (report_id, version_number desc);
create index report_reviews_report_idx on public.report_reviews (report_id, created_at desc);

alter table public.departments enable row level security;
alter table public.report_versions enable row level security;
alter table public.report_reviews enable row level security;

create policy "members view departments" on public.departments for select to authenticated
using (private.has_org_role(organization_id, array['admin','chair','reporter','reviewer','participant']::public.app_role[]));
create policy "admins manage departments" on public.departments for all to authenticated
using (private.has_org_role(organization_id, array['admin']::public.app_role[]))
with check (private.has_org_role(organization_id, array['admin']::public.app_role[]));

create policy "meeting users view report versions" on public.report_versions for select to authenticated
using (exists (select 1 from public.reports r where r.id = report_id and private.can_access_meeting(r.meeting_id)));
create policy "report editors create versions" on public.report_versions for insert to authenticated
with check (created_by = auth.uid() and exists (select 1 from public.reports r where r.id = report_id and private.can_access_meeting(r.meeting_id, 'edit')));

create policy "meeting users view reviews" on public.report_reviews for select to authenticated
using (exists (select 1 from public.reports r where r.id = report_id and private.can_access_meeting(r.meeting_id)));
create policy "reviewers create reviews" on public.report_reviews for insert to authenticated
with check (reviewer_id = auth.uid() and exists (
  select 1 from public.reports r join public.meetings m on m.id = r.meeting_id
  where r.id = report_id and private.has_org_role(m.organization_id, array['admin','chair','reviewer']::public.app_role[])
));

-- A stable query boundary for server-side filtering and pagination.
create or replace function public.search_meetings(
  p_organization_id uuid,
  p_query text default null,
  p_meeting_type text default null,
  p_department_id uuid default null,
  p_date_from date default null,
  p_date_to date default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  meeting_type text,
  meeting_date date,
  start_time time,
  location text,
  status public.meeting_status,
  department_name text,
  total_count bigint
)
language sql stable security invoker set search_path = public
as $$
  select m.id, m.title, m.meeting_type, m.meeting_date, m.start_time, m.location,
    m.status, d.name, count(*) over() as total_count
  from meetings m
  left join departments d on d.id = m.department_id
  where m.organization_id = p_organization_id
    and private.can_access_meeting(m.id)
    and (p_query is null or p_query = '' or m.search_vector @@ websearch_to_tsquery('simple', p_query) or m.title % p_query)
    and (p_meeting_type is null or m.meeting_type = p_meeting_type)
    and (p_department_id is null or m.department_id = p_department_id)
    and (p_date_from is null or m.meeting_date >= p_date_from)
    and (p_date_to is null or m.meeting_date <= p_date_to)
  order by m.meeting_date desc, m.start_time desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.search_meetings(uuid, text, text, uuid, date, date, integer, integer) to authenticated;
