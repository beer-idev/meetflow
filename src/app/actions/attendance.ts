"use server";

import { createHash, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };
type RegistrationActionResult = { ok: true; data: { url: string } } | { ok: false; error: string };

const registrationSchema = z.object({
  meetingId: z.string().uuid(),
  fullName: z.string().trim().min(2, "กรุณากรอกชื่อ–นามสกุล").max(160),
  positionTitle: z.string().trim().min(2, "กรุณากรอกตำแหน่ง").max(160),
  department: z.string().trim().max(200).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export async function registerMeetingAttendanceAction(input: unknown): Promise<RegistrationActionResult> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    const admin = createAdminClient();
    const { data: meeting } = await admin
      .from("meetings")
      .select("id,status,created_by")
      .eq("id", parsed.data.meetingId)
      .maybeSingle();

    if (!meeting) return { ok: false, error: "ไม่พบการประชุมหรือลิงก์ไม่ถูกต้อง" };
    if (meeting.status === "cancelled") return { ok: false, error: "การประชุมนี้ถูกยกเลิกแล้ว" };

    const { error } = await admin.from("meeting_attendance_registrations").insert({
      meeting_id: meeting.id,
      full_name: parsed.data.fullName,
      position_title: parsed.data.positionTitle,
      department: parsed.data.department || null,
    });

    if (error && error.code !== "23505") return { ok: false, error: "ยังไม่สามารถบันทึกรายชื่อได้ กรุณาลองใหม่" };

    const token = randomUUID().replaceAll("-", "");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: shareError } = await admin.from("share_links").insert({
      meeting_id: meeting.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: meeting.created_by,
    });
    if (shareError) return { ok: false, error: "บันทึกรายชื่อแล้ว แต่ยังเปิดหน้ารายงานไม่ได้ กรุณาติดต่อผู้จัดประชุม" };

    revalidatePath(`/attendance/${meeting.id}`);
    revalidatePath(`/meetings/${meeting.id}`);
    revalidatePath(`/print/reports/${meeting.id}`);
    return { ok: true, data: { url: `/share/${token}` } };
  } catch {
    return { ok: false, error: "ระบบลงทะเบียนยังไม่พร้อม กรุณาติดต่อผู้จัดประชุม" };
  }
}

export async function removeMeetingAttendanceAction(meetingId: string, registrationId: string): Promise<ActionResult> {
  const parsed = z.object({ meetingId: z.string().uuid(), registrationId: z.string().uuid() }).safeParse({ meetingId, registrationId });
  if (!parsed.success) return { ok: false, error: "ข้อมูลรายชื่อไม่ถูกต้อง" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "กรุณาเข้าสู่ระบบอีกครั้ง" };

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id,role")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();
  if (!membership || !["admin", "chair", "reporter"].includes(membership.role)) return { ok: false, error: "คุณไม่มีสิทธิ์ลบรายชื่อ" };

  try {
    const admin = createAdminClient();
    const { data: meeting } = await admin.from("meetings").select("id").eq("id", meetingId).eq("organization_id", membership.organization_id).maybeSingle();
    if (!meeting) return { ok: false, error: "ไม่พบการประชุม" };
    const { error } = await admin.from("meeting_attendance_registrations").delete().eq("id", registrationId).eq("meeting_id", meetingId);
    if (error) return { ok: false, error: "ลบรายชื่อไม่สำเร็จ" };
    revalidatePath(`/meetings/${meetingId}`);
    revalidatePath(`/print/reports/${meetingId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "ระบบรายชื่อยังไม่พร้อม" };
  }
}
