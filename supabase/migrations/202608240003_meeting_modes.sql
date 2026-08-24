-- Support onsite, online and hybrid meetings.
alter table public.meetings
  add column if not exists meeting_mode text not null default 'onsite';

alter table public.meetings
  add column if not exists online_url text;

do $$
begin
  alter table public.meetings
    add constraint meetings_mode_check
    check (meeting_mode in ('onsite', 'online', 'hybrid'));
exception when duplicate_object then
  null;
end $$;

create index if not exists meetings_mode_idx
  on public.meetings (organization_id, meeting_mode);
