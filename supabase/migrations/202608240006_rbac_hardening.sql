-- Keep navigation usability and database authorization aligned by role.
-- Admin, chair and reporter manage meetings; reviewer is read-only; a
-- participant gets access through meeting participation or explicit grants.
create or replace function private.can_access_meeting(
  target_meeting_id uuid,
  minimum_access public.access_level default 'view'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meetings as m
    join public.memberships as membership
      on membership.organization_id = m.organization_id
     and membership.user_id = auth.uid()
    where m.id = target_meeting_id
      and (
        membership.role in ('admin', 'chair', 'reporter')
        or (
          minimum_access = 'view'
          and exists (
            select 1 from public.meeting_participants as participant
            where participant.meeting_id = m.id
              and participant.user_id = auth.uid()
          )
        )
        or exists (
          select 1
          from public.document_permissions as permission
          where permission.meeting_id = m.id
            and permission.user_id = auth.uid()
            and case minimum_access
              when 'view' then permission.access in ('view', 'edit', 'manage')
              when 'edit' then permission.access in ('edit', 'manage')
              when 'manage' then permission.access = 'manage'
            end
        )
      )
  );
$$;

drop policy if exists "organization members view attachments" on public.attachments;
create policy "authorized users view attachments"
on public.attachments
for select
to authenticated
using (
  (meeting_id is not null and private.can_access_meeting(meeting_id, 'view'))
  or (
    report_id is not null
    and exists (
      select 1 from public.reports as report
      where report.id = attachments.report_id
        and private.can_access_meeting(report.meeting_id, 'view')
    )
  )
);

drop policy if exists "members read meeting files" on storage.objects;
create policy "authorized users read meeting files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'meeting-files'
  and array_length(storage.foldername(name), 1) >= 2
  and private.can_access_meeting((storage.foldername(name))[2]::uuid, 'view')
);

drop policy if exists "reviewers create reviews" on public.report_reviews;
create policy "assigned reviewers create reviews"
on public.report_reviews
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.reports as report
    join public.meetings as meeting on meeting.id = report.meeting_id
    where report.id = report_reviews.report_id
      and private.has_org_role(meeting.organization_id, array['admin', 'chair', 'reviewer']::public.app_role[])
      and private.can_access_meeting(report.meeting_id, 'view')
  )
);
