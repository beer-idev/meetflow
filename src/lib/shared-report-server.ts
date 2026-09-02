import "server-only";
import { createHash } from "crypto";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SharedReport } from "@/lib/shared-report";

export const getSharedReport = cache(async (token: string): Promise<SharedReport | null> => {
  if (!token || token.length > 256) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_share_link", { p_token: token });
  if (!error && data?.[0]) return data[0] as SharedReport;

  // Compatibility fallback for deployments where the public RPC migration
  // has not reached PostgREST's schema cache yet. The service key remains on
  // the server and access is still limited by the hashed, unexpired token.
  try {
    const admin = createAdminClient();
    const tokenHash = createHash("sha256").update(token.trim()).digest("hex");
    const { data: shared } = await admin
      .from("share_links")
      .select("meeting_id,expires_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!shared) return null;

    const [{ data: meeting }, { data: report }, { data: agenda }, { data: participantRows }] = await Promise.all([
      admin.from("meetings").select("id,organization_id,title,meeting_type,description,meeting_date,start_time,end_time,location,meeting_mode,online_url").eq("id", shared.meeting_id).maybeSingle(),
      admin.from("reports").select("plain_text,status,prepared_by").eq("meeting_id", shared.meeting_id).maybeSingle(),
      admin.from("agenda_items").select("position,title,detail,resolution").eq("meeting_id", shared.meeting_id).order("position"),
      admin.from("meeting_participants").select("user_id,attendance_status").eq("meeting_id", shared.meeting_id),
    ]);
    if (!meeting) return null;

    const participantIds = (participantRows ?? []).map((row) => row.user_id);
    const profileIds = Array.from(new Set([report?.prepared_by, ...participantIds].filter(Boolean))) as string[];
    const [{ data: profiles }, { data: memberships }] = await Promise.all([
      profileIds.length ? admin.from("profiles").select("id,display_name").in("id", profileIds) : Promise.resolve({ data: [] }),
      participantIds.length ? admin.from("memberships").select("user_id,role").eq("organization_id", meeting.organization_id).in("user_id", participantIds) : Promise.resolve({ data: [] }),
    ]);
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const roleMap = new Map((memberships ?? []).map((membership) => [membership.user_id, membership.role]));

    return {
      meeting_id: meeting.id,
      title: meeting.title,
      meeting_type: meeting.meeting_type,
      description: meeting.description,
      meeting_date: meeting.meeting_date,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      location: meeting.location,
      meeting_mode: meeting.meeting_mode ?? "onsite",
      online_url: meeting.online_url,
      report_text: report?.plain_text ?? null,
      report_status: report?.status ?? null,
      prepared_by: report?.prepared_by ? profileMap.get(report.prepared_by) ?? "ผู้จัดทำรายงาน" : "ผู้จัดทำรายงาน",
      expires_at: shared.expires_at,
      agenda: agenda ?? [],
      participants: (participantRows ?? []).map((participant) => ({
        name: profileMap.get(participant.user_id) ?? "ผู้เข้าร่วมประชุม",
        attendance_status: participant.attendance_status,
        role: roleMap.get(participant.user_id),
      })),
    } as SharedReport;
  } catch {
    return null;
  }
});
