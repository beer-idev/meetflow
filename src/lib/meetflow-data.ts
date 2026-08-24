/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import type { MeetingStatus } from "@/features/meetings/types";
import { cache } from "react";

export type AppContext = {
  userId: string;
  organizationId: string;
  organizationName: string;
  role: AppRole;
  profile: { displayName: string; email: string | null };
};

export type AppRole = "admin" | "chair" | "reporter" | "reviewer" | "participant";
export type AccessLevel = "view" | "edit" | "manage";

export type DepartmentOption = { id: string; name: string };
export type MemberOption = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department: string;
  initials: string;
};

export type MeetingListItem = {
  id: string;
  title: string;
  type: string;
  department: string;
  departmentId: string | null;
  date: string;
  time: string;
  endTime: string;
  location: string;
  meetingMode: "onsite" | "online" | "hybrid";
  onlineUrl: string | null;
  participantCount: number;
  status: MeetingStatus;
  owner: string;
};
export type MeetingOption = Pick<MeetingListItem, "id" | "title">;

export type AgendaView = {
  id: string;
  position: number;
  title: string;
  detail: string | null;
  resolution: string | null;
};

export type ParticipantView = MemberOption & {
  attendanceStatus: string;
  meetingRole: "chair" | "reporter" | "participant";
};

export type DocumentView = {
  id: string;
  name: string;
  meetingId: string;
  meeting: string;
  category: string;
  department: string;
  updatedAt: string;
  createdAt: string;
  size: string;
  extension: string;
};

export type ReportView = {
  id: string;
  meetingId: string;
  title: string;
  status: "draft" | "in_review" | "approved" | "published";
  version: number;
  plainText: string;
  content: Record<string, unknown>;
  updatedAt: string;
  preparedBy: string;
};

export type AuditView = {
  id: string;
  action: string;
  detail: string;
  user: string;
  time: string;
  type: string;
};

export type MeetingDetailView = MeetingListItem & {
  description: string | null;
  agenda: AgendaView[];
  participants: ParticipantView[];
  documents: DocumentView[];
  report: ReportView | null;
  permissions: Array<MemberOption & { access: AccessLevel }>;
};

export type WorkspaceData = {
  context: AppContext | null;
  meetings: MeetingListItem[];
  documents: DocumentView[];
  reports: ReportView[];
  departments: DepartmentOption[];
  members: MemberOption[];
  auditLogs: AuditView[];
};

export type ShellData = {
  context: AppContext | null;
  documentCount: number;
};

type AnySupabase = Awaited<ReturnType<typeof createClient>> & {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

// React's request-scoped cache lets the persistent workspace layout and the
// active page share one Supabase client/session lookup during navigation.
// This avoids repeating auth + membership + profile queries for every segment.
const getRequestContext = cache(async () => {
  const supabase = (await createClient()) as AnySupabase;
  const context = await getAppContext(supabase);
  return { supabase, context };
});

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const { supabase, context } = await getRequestContext();

  if (!context) {
    return { context: null, meetings: [], documents: [], reports: [], departments: [], members: [], auditLogs: [] };
  }

  const [departments, members, meetings, reports, documents, auditLogs] = await Promise.all([
    getDepartments(supabase, context.organizationId),
    getMembers(supabase, context.organizationId),
    getMeetings(supabase, context.organizationId),
    getReports(supabase, context.organizationId),
    getDocuments(supabase, context.organizationId),
    getAuditLogs(supabase, context.organizationId),
  ]);

  return { context, meetings, documents, reports, departments, members, auditLogs };
}

/**
 * Data needed by the persistent application shell only. Keeping this small is
 * important: the shell is rendered for every workspace route and should not
 * fetch reports, meetings, audit records, or file metadata just to show the
 * sidebar.
 */
export async function getShellData(): Promise<ShellData> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, documentCount: 0 };

  const { count } = await supabase
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", context.organizationId);

  return { context, documentCount: count ?? 0 };
}

export async function getDashboardData(): Promise<WorkspaceData> {
  const { supabase, context } = await getRequestContext();
  if (!context) return emptyWorkspaceData();
  const [meetings, reports, documents, members] = await Promise.all([
    getMeetings(supabase, context.organizationId),
    getReports(supabase, context.organizationId),
    getDocuments(supabase, context.organizationId),
    getMembers(supabase, context.organizationId),
  ]);
  return { context, meetings, reports, documents, members, departments: [], auditLogs: [] };
}

export async function getMeetingsPageData(): Promise<{ context: AppContext | null; meetings: MeetingListItem[]; departments: DepartmentOption[] }> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, meetings: [], departments: [] };
  const [meetings, departments] = await Promise.all([
    getMeetings(supabase, context.organizationId),
    getDepartments(supabase, context.organizationId),
  ]);
  return { context, meetings, departments };
}

export async function getDocumentsPageData(): Promise<{ context: AppContext | null; documents: DocumentView[]; meetings: MeetingOption[]; members: MemberOption[] }> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, documents: [], meetings: [], members: [] };
  const [documents, meetings, members] = await Promise.all([
    getDocuments(supabase, context.organizationId),
    getMeetingOptions(supabase, context.organizationId),
    getMembers(supabase, context.organizationId),
  ]);
  return { context, documents, meetings, members };
}

export async function getReportsPageData(): Promise<{ context: AppContext | null; reports: ReportView[] }> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, reports: [] };
  return { context, reports: await getReports(supabase, context.organizationId) };
}

export async function getMembersPageData(): Promise<{ context: AppContext | null; members: MemberOption[] }> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, members: [] };
  return { context, members: await getMembers(supabase, context.organizationId) };
}

export async function getAuditPageData(): Promise<{ context: AppContext | null; auditLogs: AuditView[] }> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, auditLogs: [] };
  return { context, auditLogs: await getAuditLogs(supabase, context.organizationId) };
}

export async function getMeetingFormData(): Promise<{ context: AppContext | null; departments: DepartmentOption[]; members: MemberOption[] }> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, departments: [], members: [] };
  const [departments, members] = await Promise.all([
    getDepartments(supabase, context.organizationId),
    getMembers(supabase, context.organizationId),
  ]);
  return { context, departments, members };
}

function emptyWorkspaceData(): WorkspaceData {
  return { context: null, meetings: [], documents: [], reports: [], departments: [], members: [], auditLogs: [] };
}

export async function getMeetingDetail(meetingId: string): Promise<{ context: AppContext | null; detail: MeetingDetailView | null; departments: DepartmentOption[]; members: MemberOption[] }> {
  const { supabase, context } = await getRequestContext();
  if (!context) return { context: null, detail: null, departments: [], members: [] };

  const [departments, members] = await Promise.all([
    getDepartments(supabase, context.organizationId),
    getMembers(supabase, context.organizationId),
  ]);

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id,title,meeting_type,description,meeting_date,start_time,end_time,location,meeting_mode,online_url,status,created_by,department_id")
    .eq("id", meetingId)
    .maybeSingle();

  if (!meeting) return { context, detail: null, departments, members };

  const [{ data: agendas }, { data: participantRows }, { data: attachments }, { data: report }, { data: permissions }] = await Promise.all([
    supabase.from("agenda_items").select("id,position,title,detail,resolution").eq("meeting_id", meetingId).order("position", { ascending: true }),
    supabase.from("meeting_participants").select("meeting_id,user_id,attendance_status").eq("meeting_id", meetingId),
    supabase.from("attachments").select("id,file_name,mime_type,file_size,category,document_date,created_at,meeting_id").eq("meeting_id", meetingId).order("created_at", { ascending: false }),
    supabase.from("reports").select("id,meeting_id,content,plain_text,status,version,prepared_by,updated_at").eq("meeting_id", meetingId).maybeSingle(),
    supabase.from("document_permissions").select("user_id,access").eq("meeting_id", meetingId),
  ]);

  const reportRows = report ? [report] : [];
  const participantIds = (participantRows ?? []).map((row: any) => row.user_id);
  const profileMap = await getProfileMap(supabase, unique([meeting.created_by, ...participantIds, ...(reportRows.map((row: any) => row.prepared_by) ?? [])]));
  const departmentMap = new Map(departments.map((department) => [department.id, department.name]));
  const reportMap = new Map(reportRows.map((row: any) => [row.meeting_id, row]));
  const mappedMeeting = mapMeeting(meeting, departmentMap, countBy(participantRows ?? [], "meeting_id"), reportMap, profileMap);

  const detail: MeetingDetailView = {
    ...mappedMeeting,
    description: meeting.description,
    agenda: (agendas ?? []).map((item: any) => ({
      id: item.id,
      position: item.position,
      title: item.title,
      detail: item.detail,
      resolution: item.resolution,
    })),
    participants: (participantRows ?? []).map((row: any) => {
      const member = members.find((item) => item.id === row.user_id) ?? fallbackMember(row.user_id, profileMap);
      return {
        ...member,
        attendanceStatus: row.attendance_status,
        meetingRole: member.role === "chair" ? "chair" : member.role === "reporter" ? "reporter" : "participant",
      };
    }),
    documents: mapDocuments(attachments ?? [], new Map([[meeting.id, meeting]]), departmentMap),
    report: report ? mapReport(report, meeting.title, profileMap) : null,
    permissions: (permissions ?? []).map((row: any) => {
      const member = members.find((item) => item.id === row.user_id) ?? fallbackMember(row.user_id, profileMap);
      return { ...member, access: row.access };
    }),
  };

  return { context, detail, departments, members };
}

async function getAppContext(supabase: AnySupabase): Promise<AppContext | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id,role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const [{ data: organization }, { data: profile }] = await Promise.all([
    supabase.from("organizations").select("id,name").eq("id", membership.organization_id).maybeSingle(),
    supabase.from("profiles").select("display_name,email").eq("id", user.id).maybeSingle(),
  ]);

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    organizationName: organization?.name ?? "MeetFlow",
    role: membership.role,
    profile: {
      displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "ผู้ใช้งาน",
      email: profile?.email ?? user.email ?? null,
    },
  };
}

async function getDepartments(supabase: AnySupabase, organizationId: string): Promise<DepartmentOption[]> {
  const { data } = await supabase.from("departments").select("id,name").eq("organization_id", organizationId).order("name");
  return (data ?? []).map((row: any) => ({ id: row.id, name: row.name }));
}

async function getMembers(supabase: AnySupabase, organizationId: string): Promise<MemberOption[]> {
  const { data: memberships } = await supabase.from("memberships").select("user_id,role").eq("organization_id", organizationId).order("created_at", { ascending: true });
  const ids = (memberships ?? []).map((row: any) => row.user_id);
  const profileMap = await getProfileMap(supabase, ids);

  return (memberships ?? []).map((row: any) => {
    const profile = profileMap.get(row.user_id);
    const name = profile?.displayName ?? "ผู้ใช้งาน";
    return {
      id: row.user_id,
      name,
      email: profile?.email ?? "ไม่พบอีเมล",
      role: row.role,
      department: roleLabel(row.role),
      initials: initials(name),
    };
  });
}

async function getMeetings(supabase: AnySupabase, organizationId: string): Promise<MeetingListItem[]> {
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id,title,meeting_type,meeting_date,start_time,end_time,location,meeting_mode,online_url,status,created_by,department_id")
    .eq("organization_id", organizationId)
    .order("meeting_date", { ascending: false });

  const meetingIds = (meetings ?? []).map((row: any) => row.id);
  const creatorIds = (meetings ?? []).map((row: any) => row.created_by);
  const [{ data: participantRows }, { data: reportRows }, departments, profileMap] = await Promise.all([
    meetingIds.length ? supabase.from("meeting_participants").select("meeting_id").in("meeting_id", meetingIds) : { data: [] },
    meetingIds.length ? supabase.from("reports").select("meeting_id,status").in("meeting_id", meetingIds) : { data: [] },
    getDepartments(supabase, organizationId),
    getProfileMap(supabase, creatorIds),
  ]);

  const departmentMap = new Map(departments.map((department) => [department.id, department.name]));
  const reportMap = new Map((reportRows ?? []).map((row: any) => [row.meeting_id, row]));
  const participantCounts = countBy(participantRows ?? [], "meeting_id");

  return (meetings ?? []).map((row: any) => mapMeeting(row, departmentMap, participantCounts, reportMap, profileMap));
}

async function getMeetingOptions(supabase: AnySupabase, organizationId: string): Promise<MeetingOption[]> {
  const { data } = await supabase
    .from("meetings")
    .select("id,title")
    .eq("organization_id", organizationId)
    .order("meeting_date", { ascending: false });
  return (data ?? []).map((row: any) => ({ id: row.id, title: row.title }));
}

async function getReports(supabase: AnySupabase, organizationId: string): Promise<ReportView[]> {
  const { data: meetings } = await supabase.from("meetings").select("id,title").eq("organization_id", organizationId);
  const meetingMap = new Map((meetings ?? []).map((row: any) => [row.id, row.title]));
  const meetingIds = Array.from(meetingMap.keys());
  if (!meetingIds.length) return [];

  const { data: reports } = await supabase
    .from("reports")
    .select("id,meeting_id,content,plain_text,status,version,prepared_by,updated_at")
    .in("meeting_id", meetingIds)
    .order("updated_at", { ascending: false });

  const profileMap = await getProfileMap(supabase, (reports ?? []).map((row: any) => row.prepared_by));
  return (reports ?? []).map((row: any) => mapReport(row, meetingMap.get(row.meeting_id) ?? "รายงานการประชุม", profileMap));
}

async function getDocuments(supabase: AnySupabase, organizationId: string): Promise<DocumentView[]> {
  const [{ data: attachments }, { data: meetings }, departments] = await Promise.all([
    supabase.from("attachments").select("id,file_name,mime_type,file_size,category,document_date,created_at,meeting_id").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("meetings").select("id,title,department_id").eq("organization_id", organizationId),
    getDepartments(supabase, organizationId),
  ]);

  return mapDocuments(attachments ?? [], new Map((meetings ?? []).map((row: any) => [row.id, row])), new Map(departments.map((department) => [department.id, department.name])));
}

async function getAuditLogs(supabase: AnySupabase, organizationId: string): Promise<AuditView[]> {
  const { data } = await supabase
    .from("audit_logs")
    .select("id,actor_id,action,entity_type,metadata,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(80);

  const profileMap = await getProfileMap(supabase, (data ?? []).map((row: any) => row.actor_id).filter(Boolean));
  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    action: auditActionLabel(row.action),
    detail: auditDetail(row),
    user: profileMap.get(row.actor_id)?.displayName ?? "ระบบ",
    time: formatDateTime(row.created_at),
    type: auditType(row.action),
  }));
}

async function getProfileMap(supabase: AnySupabase, userIds: string[]): Promise<Map<string, { displayName: string; email: string | null }>> {
  const ids = unique(userIds.filter(Boolean));
  if (!ids.length) return new Map();
  const { data } = await supabase.from("profiles").select("id,display_name,email").in("id", ids);
  return new Map((data ?? []).map((row: any) => [row.id, { displayName: row.display_name, email: row.email }]));
}

function mapMeeting(row: any, departmentMap: Map<string, string>, participantCounts: Map<string, number>, reportMap: Map<string, any>, profileMap: Map<string, { displayName: string }>): MeetingListItem {
  const report = reportMap.get(row.id);
  return {
    id: row.id,
    title: row.title,
    type: row.meeting_type,
    department: departmentMap.get(row.department_id) ?? "ไม่ระบุหน่วยงาน",
    departmentId: row.department_id,
    date: row.meeting_date,
    time: trimTime(row.start_time),
    endTime: trimTime(row.end_time) || "-",
    location: row.location ?? "",
    meetingMode: row.meeting_mode ?? "onsite",
    onlineUrl: row.online_url ?? null,
    participantCount: participantCounts.get(row.id) ?? 0,
    status: mapWorkflowStatus(row.status, report?.status),
    owner: profileMap.get(row.created_by)?.displayName ?? "ไม่ระบุผู้จัดทำ",
  };
}

function mapDocuments(rows: any[], meetingMap: Map<string, any>, departmentMap: Map<string, string>): DocumentView[] {
  return rows.map((row) => {
    const meeting = meetingMap.get(row.meeting_id);
    const extension = row.file_name.includes(".") ? row.file_name.split(".").pop()?.toUpperCase() ?? "FILE" : "FILE";
    return {
      id: row.id,
      name: row.file_name,
      meetingId: row.meeting_id,
      meeting: meeting?.title ?? "เอกสารประชุม",
      category: documentCategoryLabel(row.category),
      department: departmentMap.get(meeting?.department_id) ?? "ไม่ระบุหน่วยงาน",
      updatedAt: formatDate(row.created_at),
      createdAt: row.created_at,
      size: formatBytes(Number(row.file_size ?? 0)),
      extension,
    };
  });
}

function mapReport(row: any, title: string, profileMap: Map<string, { displayName: string }>): ReportView {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    title,
    status: row.status,
    version: row.version,
    plainText: row.plain_text,
    content: row.content ?? { type: "doc", content: [] },
    updatedAt: formatDateTime(row.updated_at),
    preparedBy: profileMap.get(row.prepared_by)?.displayName ?? "ไม่ระบุผู้จัดทำ",
  };
}

function mapWorkflowStatus(meetingStatus: string, reportStatus?: string): MeetingStatus {
  if (reportStatus === "published" || reportStatus === "approved") return "published";
  if (reportStatus === "in_review") return "review";
  if (reportStatus === "draft") return "minutes";
  if (meetingStatus === "completed") return "minutes";
  if (meetingStatus === "cancelled") return "cancelled";
  return "scheduled";
}

function fallbackMember(userId: string, profileMap: Map<string, { displayName: string; email: string | null }>): MemberOption {
  const profile = profileMap.get(userId);
  const name = profile?.displayName ?? "ผู้ใช้งาน";
  return { id: userId, name, email: profile?.email ?? "ไม่พบอีเมล", role: "participant", department: "ผู้เกี่ยวข้อง", initials: initials(name) };
}

function countBy(rows: any[], key: string) {
  return rows.reduce((map, row) => map.set(row[key], (map.get(row[key]) ?? 0) + 1), new Map<string, number>());
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function trimTime(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("") || "ผ";
}

function roleLabel(role: AppRole) {
  const labels: Record<AppRole, string> = {
    admin: "ผู้ดูแลระบบ",
    chair: "ประธานการประชุม",
    reporter: "ผู้จัดทำรายงาน",
    reviewer: "ผู้ตรวจทาน",
    participant: "ผู้เข้าร่วมประชุม",
  };
  return labels[role];
}

function documentCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    report: "รายงานการประชุม",
    agenda: "ระเบียบวาระ",
    supporting_document: "เอกสารประกอบ",
    invitation: "หนังสือเชิญ",
  };
  return labels[category] ?? category;
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    meeting_created: "สร้างการประชุม",
    report_saved: "บันทึกรายงาน",
    document_uploaded: "อัปโหลดเอกสาร",
    document_viewed: "เปิดดูเอกสาร",
    document_downloaded: "ดาวน์โหลดเอกสาร",
    document_permission_changed: "เปลี่ยนสิทธิ์เอกสาร",
    member_added: "เพิ่มสมาชิก",
    member_invited: "ส่งคำเชิญสมาชิก",
    member_created: "สร้างผู้ใช้งาน",
    member_password_changed: "เปลี่ยนรหัสผ่านผู้ใช้งาน",
    participant_added: "เพิ่มผู้เข้าร่วม",
    share_link_created: "สร้างลิงก์แชร์",
    seed_initialized: "เริ่มต้นข้อมูลตัวอย่าง",
  };
  return labels[action] ?? action;
}

function auditDetail(row: any) {
  const metadata = row.metadata ?? {};
  return metadata.title ?? metadata.file_name ?? metadata.email ?? row.entity_type;
}

function auditType(action: string) {
  if (action.includes("download")) return "download";
  if (action.includes("permission")) return "permission";
  if (action.includes("share")) return "share";
  if (action.includes("member") || action.includes("participant")) return "permission";
  if (action.includes("upload")) return "upload";
  return "edit";
}

function formatBytes(size: number) {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
