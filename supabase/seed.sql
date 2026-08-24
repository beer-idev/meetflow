-- MeetFlow demonstration data
--
-- Run this only after both files in supabase/migrations have been applied.
-- It uses the first existing Supabase Auth user as the workspace administrator.
-- Create that user first in Dashboard > Authentication > Users, or sign in via
-- the application once Auth is configured. Do not use this seed in production.

do $$
declare
  v_admin_id uuid;
  v_admin_email text;
  v_organization_id constant uuid := '0e9d3a8b-89dd-4f3d-a6a1-4c52344243d1';
  v_management_id constant uuid := '4f5c7a24-0d77-4df1-8a36-66979d068ab7';
  v_planning_id constant uuid := 'b13ca990-6b42-4d44-b39a-b3fe59e96583';
  v_secretariat_id constant uuid := 'c0d1087d-b81e-46dc-8ee9-b3e18d4ffebd';
  v_meeting_one_id constant uuid := '7fb1c48a-8070-4820-b477-9ea1aa25f4d1';
  v_meeting_two_id constant uuid := 'a60d0ce9-167d-4352-9f95-c3e1c7ab2a83';
  v_meeting_three_id constant uuid := 'ee8d3c31-38f5-4b2c-bdb2-6262235084fd';
  v_report_one_id constant uuid := 'e9c42778-62c8-4030-9e5f-26b6aa68b3f4';
  v_report_two_id constant uuid := '145a0e6d-84bb-4df3-8aa9-47b9749cd998';
begin
  select id, email into v_admin_id, v_admin_email
  from auth.users
  order by created_at asc
  limit 1;

  if v_admin_id is null then
    raise exception 'Seed stopped: create an Auth user first in Dashboard > Authentication > Users.';
  end if;

  -- Covers users that existed before the profile trigger was created.
  insert into public.profiles (id, display_name)
  values (v_admin_id, coalesce(split_part(v_admin_email, '@', 1), 'MeetFlow Admin'))
  on conflict (id) do nothing;

  insert into public.organizations (id, name, slug, created_by)
  values (v_organization_id, 'MeetFlow Demo Workspace', 'meetflow-demo', v_admin_id)
  on conflict (id) do update set name = excluded.name, slug = excluded.slug;

  insert into public.memberships (organization_id, user_id, role)
  values (v_organization_id, v_admin_id, 'admin')
  on conflict (organization_id, user_id) do update set role = excluded.role;

  insert into public.departments (id, organization_id, name, code)
  values
    (v_management_id, v_organization_id, 'สำนักบริหารกลาง', 'ADM'),
    (v_planning_id, v_organization_id, 'กองแผนงาน', 'PLN'),
    (v_secretariat_id, v_organization_id, 'ฝ่ายเลขานุการ', 'SEC')
  on conflict (id) do update set name = excluded.name, code = excluded.code;

  insert into public.meetings (
    id, organization_id, department_id, title, meeting_type, description,
    meeting_date, start_time, end_time, location, status, created_by
  )
  values
    (
      v_meeting_one_id, v_organization_id, v_management_id,
      'ประชุมคณะกรรมการบริหาร ครั้งที่ 8/2569', 'คณะกรรมการ',
      'ติดตามผลการดำเนินงานและพิจารณาแผนงานไตรมาส 3',
      current_date + 3, '09:30', '12:00', 'ห้องประชุมใหญ่ ชั้น 4', 'scheduled', v_admin_id
    ),
    (
      v_meeting_two_id, v_organization_id, v_planning_id,
      'ประชุมติดตามแผนงานไตรมาส 3', 'โครงการ',
      'ทบทวนตัวชี้วัดและรายการที่ต้องเร่งรัด',
      current_date + 5, '13:30', '15:30', 'Google Meet', 'scheduled', v_admin_id
    ),
    (
      v_meeting_three_id, v_organization_id, v_secretariat_id,
      'ประชุมฝ่ายเลขานุการและงานสารบรรณ', 'ประชุมภายใน',
      'สรุปผลการดำเนินงานและปรับปรุงขั้นตอนเอกสาร',
      current_date - 4, '10:00', '11:30', 'ห้องประชุม 2 ชั้น 3', 'completed', v_admin_id
    )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    meeting_date = excluded.meeting_date,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    location = excluded.location,
    status = excluded.status,
    department_id = excluded.department_id,
    updated_at = now();

  insert into public.meeting_participants (meeting_id, user_id, attendance_status)
  values
    (v_meeting_one_id, v_admin_id, 'accepted'),
    (v_meeting_two_id, v_admin_id, 'accepted'),
    (v_meeting_three_id, v_admin_id, 'attended')
  on conflict (meeting_id, user_id) do update set attendance_status = excluded.attendance_status;

  insert into public.document_permissions (meeting_id, user_id, access, granted_by)
  values
    (v_meeting_one_id, v_admin_id, 'manage', v_admin_id),
    (v_meeting_two_id, v_admin_id, 'manage', v_admin_id),
    (v_meeting_three_id, v_admin_id, 'manage', v_admin_id)
  on conflict (meeting_id, user_id) do update set access = excluded.access, granted_by = excluded.granted_by;

  insert into public.agenda_items (meeting_id, position, title, detail, presenter_id, resolution)
  values
    (v_meeting_one_id, 1, 'เรื่องประธานแจ้งให้ที่ประชุมทราบ', 'ติดตามผลการดำเนินงานประจำเดือน', v_admin_id, null),
    (v_meeting_one_id, 2, 'รับรองรายงานการประชุมครั้งที่ผ่านมา', 'พิจารณารายงานการประชุมครั้งที่ 7/2569', v_admin_id, null),
    (v_meeting_one_id, 3, 'เรื่องเสนอเพื่อพิจารณา', 'แผนดำเนินงานไตรมาส 3', v_admin_id, null),
    (v_meeting_three_id, 1, 'สรุปผลการดำเนินงาน', 'รายงานผลการจัดเก็บและส่งหนังสือ', v_admin_id, 'ที่ประชุมรับทราบ'),
    (v_meeting_three_id, 2, 'ทบทวนขั้นตอนงานสารบรรณ', 'พิจารณาจุดที่ต้องปรับปรุง', v_admin_id, 'มอบหมายฝ่ายเลขานุการปรับคู่มือภายใน 7 วัน')
  on conflict (meeting_id, position) do update set
    title = excluded.title,
    detail = excluded.detail,
    resolution = excluded.resolution;

  insert into public.reports (
    id, meeting_id, content, plain_text, status, version, prepared_by,
    reviewed_by, reviewed_at, published_at
  )
  values
    (
      v_report_one_id, v_meeting_one_id,
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"ร่างรายงานการประชุมคณะกรรมการบริหาร"}]}]}'::jsonb,
      'ร่างรายงานการประชุมคณะกรรมการบริหาร ครั้งที่ 8/2569',
      'draft', 1, v_admin_id, null, null, null
    ),
    (
      v_report_two_id, v_meeting_three_id,
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"รายงานการประชุมฝ่ายเลขานุการและงานสารบรรณ"}]}]}'::jsonb,
      'รายงานการประชุมฝ่ายเลขานุการและงานสารบรรณ สรุปผลการดำเนินงานและมติที่ประชุม',
      'published', 1, v_admin_id, v_admin_id, now() - interval '2 days', now() - interval '1 day'
    )
  on conflict (id) do update set
    content = excluded.content,
    plain_text = excluded.plain_text,
    status = excluded.status,
    version = excluded.version,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at,
    published_at = excluded.published_at,
    updated_at = now();

  insert into public.report_versions (report_id, version_number, content, plain_text, created_by)
  select id, version, content, plain_text, prepared_by
  from public.reports
  where id in (v_report_one_id, v_report_two_id)
  on conflict (report_id, version_number) do update set
    content = excluded.content,
    plain_text = excluded.plain_text,
    created_by = excluded.created_by;

  insert into public.report_reviews (report_id, reviewer_id, decision, comment)
  select v_report_two_id, v_admin_id, 'approved', 'ตรวจทานแล้ว สามารถเผยแพร่ได้'
  where not exists (
    select 1 from public.report_reviews
    where report_id = v_report_two_id and reviewer_id = v_admin_id and decision = 'approved'
  );

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  select v_organization_id, v_admin_id, 'seed_initialized', 'organization', v_organization_id,
    jsonb_build_object('source', 'supabase/seed.sql', 'admin_email', v_admin_email)
  where not exists (
    select 1 from public.audit_logs
    where organization_id = v_organization_id and action = 'seed_initialized'
      and metadata->>'source' = 'supabase/seed.sql'
  );

  raise notice 'MeetFlow seed complete. Workspace: MeetFlow Demo Workspace. Admin: %', v_admin_email;
end $$;

-- Attachments are intentionally not inserted here: each attachment must have a
-- real object in the private `meeting-files` Storage bucket. Upload test files
-- through the application after seeding.
