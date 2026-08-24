-- Resolve a short-lived share token without exposing share_links through public table access.
create or replace function public.resolve_share_link(p_token text)
returns table (
  meeting_id uuid,
  title text,
  meeting_date date,
  start_time time,
  end_time time,
  location text,
  report_text text,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select m.id,
    m.title,
    m.meeting_date,
    m.start_time,
    m.end_time,
    m.location,
    r.plain_text,
    s.expires_at
  from public.share_links s
  join public.meetings m on m.id = s.meeting_id
  left join public.reports r on r.meeting_id = m.id
  where s.token_hash = encode(digest(trim(p_token), 'sha256'), 'hex')
    and s.revoked_at is null
    and s.expires_at > now();
$$;

revoke all on function public.resolve_share_link(text) from public;
grant execute on function public.resolve_share_link(text) to anon, authenticated;
