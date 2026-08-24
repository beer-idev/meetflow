"use server";

import { randomUUID, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { meetingSchema } from "@/lib/meeting-schema";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult<T = undefined> = T extends undefined ? { ok: true } | { ok: false; error: string } : { ok: true; data: T } | { ok: false; error: string };

const roleSchema = z.enum(["admin", "chair", "reporter", "reviewer", "participant"]);
const accessSchema = z.enum(["view", "edit", "manage"]);
const meetingManagerRoles = ["admin", "chair", "reporter"];

const createMeetingInput = meetingSchema.extend({
  departmentId: z.string().uuid().nullable().optional(),
  endTime: z.string().optional(),
  participantIds: z.array(z.string().uuid()).default([]),
  agendaTitles: z.array(z.string().trim().min(1)).default([]),
});

const uploadDocumentInput = z.object({
  meetingId: z.string().uuid(),
  category: z.enum(["report", "agenda", "supporting_document", "invitation"]).default("supporting_document"),
});

const reportSaveInput = z.object({
  reportId: z.string().uuid().nullable().optional(),
  meetingId: z.string().uuid(),
  content: z.record(z.string(), z.unknown()),
  plainText: z.string().max(200000),
});

async function getContext() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { supabase, error: "กรุณาเข้าสู่ระบบอีกครั้ง" as const };

  const { data: membership, error } = await supabase
    .from("memberships")
    .select("organization_id,role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !membership) return { supabase, error: "ไม่พบสิทธิ์เข้าใช้งานองค์กร" as const };
  return { supabase, user, organizationId: membership.organization_id as string, role: membership.role as string };
}

async function writeAudit(supabase: Awaited<ReturnType<typeof createClient>>, organizationId: string, actorId: string, action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown>) {
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}

export async function createMeetingAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (!meetingManagerRoles.includes(context.role)) return { ok: false, error: "คุณไม่มีสิทธิ์สร้างการประชุม" };

  const parsed = createMeetingInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลการประชุมไม่ถูกต้อง" };

  const values = parsed.data;
  const { data, error } = await context.supabase
    .from("meetings")
    .insert({
      organization_id: context.organizationId,
      department_id: values.departmentId || null,
      title: values.title,
      meeting_date: values.date,
      start_time: values.startTime,
      end_time: values.endTime || null,
      location: values.location || "",
      meeting_mode: values.meetingMode,
      online_url: values.onlineUrl || null,
      meeting_type: values.type,
      description: values.description || null,
      created_by: context.user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  const meetingId = data.id as string;

  const participantIds = Array.from(new Set([context.user.id, ...values.participantIds]));
  if (participantIds.length) {
    await context.supabase.from("meeting_participants").insert(participantIds.map((userId) => ({ meeting_id: meetingId, user_id: userId, attendance_status: userId === context.user.id ? "accepted" : "invited" })));
    await context.supabase.from("document_permissions").insert(participantIds.map((userId) => ({ meeting_id: meetingId, user_id: userId, access: userId === context.user.id ? "manage" : "view", granted_by: context.user.id })));
  }

  const agendaTitles = values.agendaTitles.filter(Boolean);
  if (agendaTitles.length) {
    await context.supabase.from("agenda_items").insert(agendaTitles.map((title, index) => ({ meeting_id: meetingId, position: index + 1, title })));
  }

  await writeAudit(context.supabase, context.organizationId, context.user.id, "meeting_created", "meeting", meetingId, { title: values.title });
  revalidatePath("/");
  revalidatePath("/meetings");
  return { ok: true, data: { id: meetingId } };
}

export async function addParticipantAction(meetingId: string, userId: string): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (!meetingManagerRoles.includes(context.role)) return { ok: false, error: "คุณไม่มีสิทธิ์จัดการผู้เข้าร่วมประชุม" };

  const parsed = z.object({ meetingId: z.string().uuid(), userId: z.string().uuid() }).safeParse({ meetingId, userId });
  if (!parsed.success) return { ok: false, error: "ข้อมูลผู้เข้าร่วมไม่ถูกต้อง" };

  const { error } = await context.supabase
    .from("meeting_participants")
    .upsert({ meeting_id: meetingId, user_id: userId, attendance_status: "invited" }, { onConflict: "meeting_id,user_id" });
  if (error) return { ok: false, error: error.message };

  await context.supabase.from("document_permissions").upsert({ meeting_id: meetingId, user_id: userId, access: "view", granted_by: context.user.id }, { onConflict: "meeting_id,user_id" });
  await writeAudit(context.supabase, context.organizationId, context.user.id, "participant_added", "meeting", meetingId, { user_id: userId });
  revalidatePath(`/meetings/${meetingId}`);
  return { ok: true };
}

export async function uploadDocumentAction(formData: FormData): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (!meetingManagerRoles.includes(context.role)) return { ok: false, error: "คุณไม่มีสิทธิ์อัปโหลดเอกสาร" };

  const file = formData.get("file");
  const parsed = uploadDocumentInput.safeParse({
    meetingId: formData.get("meetingId"),
    category: formData.get("category") || "supporting_document",
  });
  if (!parsed.success || !(file instanceof File)) return { ok: false, error: "กรุณาเลือกไฟล์และการประชุม" };
  if (file.size <= 0) return { ok: false, error: "ไฟล์ว่าง ไม่สามารถอัปโหลดได้" };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: "ไฟล์ต้องไม่เกิน 50 MB" };

  const safeName = file.name.replace(/[^\w.\-\u0E00-\u0E7F ]/g, "_");
  const storagePath = `${context.organizationId}/${parsed.data.meetingId}/${Date.now()}-${randomUUID()}-${safeName}`;
  const { error: uploadError } = await context.supabase.storage.from("meeting-files").upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { error } = await context.supabase.from("attachments").insert({
    organization_id: context.organizationId,
    meeting_id: parsed.data.meetingId,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
    category: parsed.data.category,
    uploaded_by: context.user.id,
  });
  if (error) return { ok: false, error: error.message };

  await writeAudit(context.supabase, context.organizationId, context.user.id, "document_uploaded", "meeting", parsed.data.meetingId, { file_name: file.name });
  revalidatePath("/documents");
  revalidatePath(`/meetings/${parsed.data.meetingId}`);
  return { ok: true };
}

async function getDocumentSignedUrl(documentId: string, download: boolean): Promise<ActionResult<{ url: string }>> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };

  const { data: attachment, error } = await context.supabase
    .from("attachments")
    .select("id,file_name,storage_path,meeting_id")
    .eq("id", documentId)
    .maybeSingle();
  if (error || !attachment) return { ok: false, error: "ไม่พบเอกสาร" };

  const { data, error: signedError } = await context.supabase.storage.from("meeting-files").createSignedUrl(attachment.storage_path, 60 * 5, download ? { download: attachment.file_name } : undefined);
  if (signedError || !data?.signedUrl) return { ok: false, error: signedError?.message ?? "สร้างลิงก์ดาวน์โหลดไม่ได้" };

  await writeAudit(context.supabase, context.organizationId, context.user.id, download ? "document_downloaded" : "document_viewed", "attachment", attachment.id, { file_name: attachment.file_name, meeting_id: attachment.meeting_id });
  return { ok: true, data: { url: data.signedUrl } };
}

export async function getDocumentDownloadUrlAction(documentId: string) {
  return getDocumentSignedUrl(documentId, true);
}

export async function getDocumentViewUrlAction(documentId: string) {
  return getDocumentSignedUrl(documentId, false);
}

export async function grantDocumentPermissionAction(meetingId: string, userId: string, access: string): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (!meetingManagerRoles.includes(context.role)) return { ok: false, error: "คุณไม่มีสิทธิ์กำหนดสิทธิ์เอกสาร" };
  const parsed = z.object({ meetingId: z.string().uuid(), userId: z.string().uuid(), access: accessSchema }).safeParse({ meetingId, userId, access });
  if (!parsed.success) return { ok: false, error: "ข้อมูลสิทธิ์ไม่ถูกต้อง" };

  const { error } = await context.supabase.from("document_permissions").upsert({ meeting_id: meetingId, user_id: userId, access: parsed.data.access, granted_by: context.user.id }, { onConflict: "meeting_id,user_id" });
  if (error) return { ok: false, error: error.message };
  await writeAudit(context.supabase, context.organizationId, context.user.id, "document_permission_changed", "meeting", meetingId, { user_id: userId, access: parsed.data.access });
  revalidatePath("/documents");
  revalidatePath(`/meetings/${meetingId}`);
  return { ok: true };
}

export async function grantDocumentPermissionsAction(meetingId: string, userIds: string[], access: string): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (!meetingManagerRoles.includes(context.role)) return { ok: false, error: "คุณไม่มีสิทธิ์กำหนดสิทธิ์เอกสาร" };
  const parsed = z.object({ meetingId: z.string().uuid(), userIds: z.array(z.string().uuid()).min(1).max(100), access: accessSchema }).safeParse({ meetingId, userIds, access });
  if (!parsed.success) return { ok: false, error: "กรุณาเลือกผู้ใช้งานและสิทธิ์ให้ถูกต้อง" };

  const uniqueUserIds = Array.from(new Set(parsed.data.userIds));
  const { error } = await context.supabase.from("document_permissions").upsert(
    uniqueUserIds.map((userId) => ({ meeting_id: meetingId, user_id: userId, access: parsed.data.access, granted_by: context.user.id })),
    { onConflict: "meeting_id,user_id" },
  );
  if (error) return { ok: false, error: error.message };
  await writeAudit(context.supabase, context.organizationId, context.user.id, "document_permission_changed", "meeting", meetingId, { user_ids: uniqueUserIds, access: parsed.data.access });
  revalidatePath("/documents");
  revalidatePath(`/meetings/${meetingId}`);
  return { ok: true };
}

export async function addMemberAction(email: string, role: string): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  const parsed = z.object({ email: z.string().email(), role: roleSchema }).safeParse({ email, role });
  if (!parsed.success) return { ok: false, error: "กรุณาระบุอีเมลและบทบาทให้ถูกต้อง" };

  const { error } = await context.supabase.rpc("add_member_by_email", {
    p_organization_id: context.organizationId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error) return { ok: false, error: error.message === "user_not_found" ? "ต้องสร้างผู้ใช้นี้ใน Supabase Auth ก่อน" : error.message };

  await writeAudit(context.supabase, context.organizationId, context.user.id, "member_added", "organization", context.organizationId, { email: parsed.data.email, role: parsed.data.role });
  revalidatePath("/members");
  return { ok: true };
}

export async function createMemberAction(displayName: string, email: string, password: string, role: string): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (context.role !== "admin") return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้นที่สร้างผู้ใช้งานได้" };
  const parsed = z.object({ displayName: z.string().trim().min(2).max(120), email: z.string().trim().email(), password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"), role: roleSchema }).safeParse({ displayName, email, password, role });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "กรุณากรอกข้อมูลผู้ใช้งานให้ครบถ้วน" };

  let admin;
  try { admin = createAdminClient(); } catch { return { ok: false, error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในเซิร์ฟเวอร์" }; }
  const created = await admin.auth.admin.createUser({ email: parsed.data.email, password: parsed.data.password, email_confirm: true, user_metadata: { display_name: parsed.data.displayName, password_set: true, must_set_password: false } });
  if (created.error || !created.data.user) return { ok: false, error: created.error?.message ?? "สร้างบัญชีผู้ใช้ไม่สำเร็จ" };

  const membership = await context.supabase.rpc("add_member_by_email", { p_organization_id: context.organizationId, p_email: parsed.data.email, p_role: parsed.data.role });
  if (membership.error) {
    await admin.auth.admin.deleteUser(created.data.user.id);
    return { ok: false, error: membership.error.message };
  }
  await writeAudit(context.supabase, context.organizationId, context.user.id, "member_created", "organization", context.organizationId, { email: parsed.data.email, role: parsed.data.role });
  revalidatePath("/members");
  return { ok: true };
}

export async function setMemberPasswordAction(userId: string, password: string): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (context.role !== "admin") return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้นที่เปลี่ยนรหัสผ่านได้" };
  const parsed = z.object({ userId: z.string().uuid(), password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร") }).safeParse({ userId, password });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "รหัสผ่านไม่ถูกต้อง" };
  let admin;
  try { admin = createAdminClient(); } catch { return { ok: false, error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในเซิร์ฟเวอร์" }; }
  const updated = await admin.auth.admin.updateUserById(parsed.data.userId, { password: parsed.data.password, user_metadata: { password_set: true, must_set_password: false } });
  if (updated.error) return { ok: false, error: updated.error.message };
  await writeAudit(context.supabase, context.organizationId, context.user.id, "member_password_changed", "user", parsed.data.userId, {});
  revalidatePath("/members");
  return { ok: true };
}

export async function inviteMemberAction(displayName: string, email: string, role: string): Promise<ActionResult> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };

  const parsed = z.object({ displayName: z.string().trim().min(2).max(120), email: z.string().email(), role: roleSchema }).safeParse({ displayName, email, role });
  if (!parsed.success) return { ok: false, error: "กรุณาระบุชื่อ อีเมล และบทบาทให้ถูกต้อง" };
  if (context.role !== "admin") return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้นที่เชิญผู้ใช้ใหม่ได้" };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    const existing = await context.supabase.rpc("add_member_by_email", {
      p_organization_id: context.organizationId,
      p_email: parsed.data.email,
      p_role: parsed.data.role,
    });
    if (!existing.error) {
      await writeAudit(context.supabase, context.organizationId, context.user.id, "member_added", "organization", context.organizationId, { email: parsed.data.email, role: parsed.data.role });
      revalidatePath("/members");
      return { ok: true };
    }
    return { ok: false, error: "ผู้ใช้นี้ยังไม่มีบัญชีใน Supabase Auth และระบบยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY" };
  }

  const invited = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { display_name: parsed.data.displayName, must_set_password: true, password_set: false },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm?next=/set-password`,
  });
  if (invited.error) {
    const existing = await context.supabase.rpc("add_member_by_email", {
      p_organization_id: context.organizationId,
      p_email: parsed.data.email,
      p_role: parsed.data.role,
    });
    if (existing.error) {
      return { ok: false, error: invited.error.code === "email_exists" ? "อีเมลนี้มีบัญชีอยู่แล้ว แต่ยังเพิ่มเข้าองค์กรไม่ได้" : invited.error.message };
    }
    await writeAudit(context.supabase, context.organizationId, context.user.id, "member_added", "organization", context.organizationId, { email: parsed.data.email, role: parsed.data.role });
    revalidatePath("/members");
    return { ok: true };
  }

  const membership = await context.supabase.rpc("add_member_by_email", {
    p_organization_id: context.organizationId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (membership.error) {
    if (invited.data.user) await admin.auth.admin.deleteUser(invited.data.user.id);
    return { ok: false, error: membership.error.message };
  }

  await writeAudit(context.supabase, context.organizationId, context.user.id, "member_invited", "organization", context.organizationId, { email: parsed.data.email, role: parsed.data.role });
  revalidatePath("/members");
  return { ok: true };
}

export async function createShareLinkAction(meetingId: string): Promise<ActionResult<{ url: string }>> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (!meetingManagerRoles.includes(context.role)) return { ok: false, error: "คุณไม่มีสิทธิ์สร้างลิงก์แชร์" };
  const parsed = z.string().uuid().safeParse(meetingId);
  if (!parsed.success) return { ok: false, error: "ข้อมูลการประชุมไม่ถูกต้อง" };

  const token = randomUUID().replaceAll("-", "");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await context.supabase.from("share_links").insert({ meeting_id: meetingId, token_hash: tokenHash, expires_at: expiresAt, created_by: context.user.id });
  if (error) return { ok: false, error: error.message };

  await writeAudit(context.supabase, context.organizationId, context.user.id, "share_link_created", "meeting", meetingId, { expires_at: expiresAt });
  return { ok: true, data: { url: `/share/${token}` } };
}

export async function saveReportAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const context = await getContext();
  if ("error" in context && context.error) return { ok: false, error: context.error };
  if (!meetingManagerRoles.includes(context.role)) return { ok: false, error: "คุณไม่มีสิทธิ์แก้ไขรายงานการประชุม" };

  const parsed = reportSaveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "เนื้อหารายงานไม่ถูกต้อง" };

  const values = parsed.data;
  const current = values.reportId
    ? await context.supabase.from("reports").select("id,version").eq("id", values.reportId).maybeSingle()
    : await context.supabase.from("reports").select("id,version").eq("meeting_id", values.meetingId).maybeSingle();
  if (current.error) return { ok: false, error: current.error.message };

  const nextVersion = Number(current.data?.version ?? 0) + 1;
  const payload = {
    meeting_id: values.meetingId,
    content: values.content,
    plain_text: values.plainText,
    status: "draft",
    version: nextVersion,
    prepared_by: context.user.id,
    updated_at: new Date().toISOString(),
  };
  const saved = values.reportId
    ? await context.supabase.from("reports").update(payload).eq("id", values.reportId).select("id").single()
    : await context.supabase.from("reports").upsert(payload, { onConflict: "meeting_id" }).select("id").single();
  if (saved.error || !saved.data) return { ok: false, error: saved.error?.message ?? "บันทึกรายงานไม่สำเร็จ" };

  await context.supabase.from("report_versions").insert({ report_id: saved.data.id, version_number: nextVersion, content: values.content, plain_text: values.plainText, created_by: context.user.id });
  await writeAudit(context.supabase, context.organizationId, context.user.id, "report_saved", "report", saved.data.id, { meeting_id: values.meetingId, version: nextVersion });
  revalidatePath("/reports");
  revalidatePath(`/meetings/${values.meetingId}`);
  return { ok: true, data: { id: saved.data.id as string } };
}
