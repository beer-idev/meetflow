import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_USER_PASSWORD || "12345678";

if (!url || !serviceRoleKey) {
  throw new Error("ต้องตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ก่อนรัน seed");
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const organizationId = "0e9d3a8b-89dd-4f3d-a6a1-4c52344243d1";
const users = [
  { key: "admin", email: "admin@gmail.com", name: "ผู้ดูแลระบบ", role: "admin" },
  { key: "chair", email: "chair@meetflow.local", name: "ประธานการประชุม", role: "chair" },
  { key: "reporter", email: "reporter@meetflow.local", name: "ผู้จัดทำรายงาน", role: "reporter" },
  { key: "reviewer", email: "reviewer@meetflow.local", name: "ผู้ตรวจทาน", role: "reviewer" },
  { key: "participant", email: "participant@meetflow.local", name: "ผู้เข้าร่วมประชุม", role: "participant" },
  { key: "staff", email: "staff@meetflow.local", name: "เจ้าหน้าที่ประสานงาน", role: "participant" },
];

const departments = [
  { id: "4f5c7a24-0d77-4df1-8a36-66979d068ab7", name: "สำนักบริหารกลาง", code: "ADM" },
  { id: "b13ca990-6b42-4d44-b39a-b3fe59e96583", name: "กองแผนงาน", code: "PLN" },
  { id: "c0d1087d-b81e-46dc-8ee9-b3e18d4ffebd", name: "ฝ่ายเลขานุการ", code: "SEC" },
];

const meetings = [
  { id: "7fb1c48a-8070-4820-b477-9ea1aa25f4d1", department_id: departments[0].id, title: "ประชุมคณะกรรมการบริหาร ครั้งที่ 8/2569", meeting_type: "คณะกรรมการ", description: "ติดตามผลการดำเนินงานและพิจารณาแผนงานไตรมาส 3", meeting_date: "2026-08-28", start_time: "09:30", end_time: "12:00", location: "ห้องประชุมใหญ่ ชั้น 4", meeting_mode: "onsite", online_url: null, status: "scheduled" },
  { id: "a60d0ce9-167d-4352-9f95-c3e1c7ab2a83", department_id: departments[1].id, title: "ประชุมติดตามแผนงานไตรมาส 3", meeting_type: "โครงการ", description: "ทบทวนตัวชี้วัดและรายการที่ต้องเร่งรัด", meeting_date: "2026-09-02", start_time: "13:30", end_time: "15:30", location: "Google Meet", meeting_mode: "online", online_url: "https://meet.google.com/meetflow-demo-q3", status: "scheduled" },
  { id: "ee8d3c31-38f5-4b2c-bdb2-6262235084fd", department_id: departments[2].id, title: "ประชุมฝ่ายเลขานุการและงานสารบรรณ", meeting_type: "ประชุมภายใน", description: "สรุปผลการดำเนินงานและปรับปรุงขั้นตอนเอกสาร", meeting_date: "2026-08-20", start_time: "10:00", end_time: "11:30", location: "ห้องประชุม 2 ชั้น 3", meeting_mode: "hybrid", online_url: "https://zoom.us/j/1234567890", status: "completed" },
  { id: "f2d2d838-3a79-4f7e-8f66-1a2e98e8c09d", department_id: departments[1].id, title: "ประชุมวางแผนงบประมาณประจำปี", meeting_type: "ประชุมภายใน", description: "จัดทำกรอบงบประมาณและมอบหมายผู้รับผิดชอบ", meeting_date: "2026-09-10", start_time: "09:00", end_time: "11:00", location: "Google Meet", meeting_mode: "online", online_url: "https://meet.google.com/meetflow-budget", status: "scheduled" },
];

const meetingUsers = {
  [meetings[0].id]: ["admin", "chair", "reporter", "participant"],
  [meetings[1].id]: ["admin", "reporter", "reviewer", "participant", "staff"],
  [meetings[2].id]: ["admin", "chair", "reviewer", "staff"],
  [meetings[3].id]: ["admin", "chair", "reporter", "participant", "staff"],
};

async function ensureUsers() {
  const result = {};
  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;

  for (const item of users) {
    const existing = listed.data.users.find((user) => user.email?.toLowerCase() === item.email.toLowerCase());
    let user;
    if (existing) {
      const updated = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { ...existing.user_metadata, display_name: item.name, password_set: true, must_set_password: false },
      });
      if (updated.error) throw updated.error;
      user = updated.data.user;
    } else {
      const created = await supabase.auth.admin.createUser({
        email: item.email,
        password,
        email_confirm: true,
        user_metadata: { display_name: item.name, password_set: true, must_set_password: false },
      });
      if (created.error || !created.data.user) throw created.error || new Error(`สร้าง ${item.email} ไม่สำเร็จ`);
      user = created.data.user;
    }
    result[item.key] = user.id;
    const profile = await supabase.from("profiles").upsert({ id: user.id, display_name: item.name, email: item.email }, { onConflict: "id" });
    if (profile.error) throw profile.error;
  }
  return result;
}

async function upsert(table, rows, onConflict) {
  const { error } = await supabase.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  if (error) throw error;
}

function pdfBytes(title, body) {
  const escape = (value) => value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const stream = `BT /F1 16 Tf 60 780 Td (${escape(title)}) Tj 0 -28 Td /F1 11 Tf (${escape(body)}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let output = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(output, "utf8"));
    output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(output, "utf8");
}

async function seed() {
  const userIds = await ensureUsers();
  await upsert("organizations", { id: organizationId, name: "MeetFlow Demo Workspace", slug: "meetflow-demo", created_by: userIds.admin });
  await upsert("departments", departments.map((item) => ({ ...item, organization_id: organizationId })));
  await upsert("memberships", users.map((item) => ({ organization_id: organizationId, user_id: userIds[item.key], role: item.role })), "organization_id,user_id");

  await upsert("meetings", meetings.map((meeting) => ({ ...meeting, organization_id: organizationId, created_by: userIds.admin })), "id");
  for (const meeting of meetings) {
    const ids = meetingUsers[meeting.id].map((key) => userIds[key]);
    await upsert("meeting_participants", ids.map((userId) => ({ meeting_id: meeting.id, user_id: userId, attendance_status: userId === userIds.admin ? "accepted" : meeting.status === "completed" ? "attended" : "invited" })), "meeting_id,user_id");
    await upsert("document_permissions", ids.map((userId) => ({ meeting_id: meeting.id, user_id: userId, access: userId === userIds.admin ? "manage" : "view", granted_by: userIds.admin })), "meeting_id,user_id");
  }

  await upsert("agenda_items", [
    { meeting_id: meetings[0].id, position: 1, title: "ประธานแจ้งให้ที่ประชุมทราบ", detail: "ติดตามผลการดำเนินงานประจำเดือน", presenter_id: userIds.chair },
    { meeting_id: meetings[0].id, position: 2, title: "รับรองรายงานการประชุมครั้งที่ผ่านมา", detail: "พิจารณารายงานการประชุมครั้งที่ 7/2569", presenter_id: userIds.reporter },
    { meeting_id: meetings[0].id, position: 3, title: "เรื่องเสนอเพื่อพิจารณา", detail: "แผนดำเนินงานไตรมาส 3", presenter_id: userIds.chair },
    { meeting_id: meetings[2].id, position: 1, title: "สรุปผลการดำเนินงาน", detail: "รายงานผลการจัดเก็บและส่งหนังสือ", presenter_id: userIds.reporter, resolution: "ที่ประชุมรับทราบ" },
    { meeting_id: meetings[2].id, position: 2, title: "ทบทวนขั้นตอนงานสารบรรณ", detail: "พิจารณาจุดที่ต้องปรับปรุง", presenter_id: userIds.staff, resolution: "มอบหมายฝ่ายเลขานุการปรับคู่มือภายใน 7 วัน" },
  ], "meeting_id,position");

  const reports = [
    { id: "e9c42778-62c8-4030-9e5f-26b6aa68b3f4", meeting_id: meetings[0].id, content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "ร่างรายงานการประชุมคณะกรรมการบริหาร" }] }] }, plain_text: "ร่างรายงานการประชุมคณะกรรมการบริหาร", status: "draft", version: 1, prepared_by: userIds.reporter },
    { id: "145a0e6d-84bb-4df3-8aa9-47b9749cd998", meeting_id: meetings[2].id, content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "รายงานการประชุมฝ่ายเลขานุการและงานสารบรรณ" }] }] }, plain_text: "รายงานการประชุมฝ่ายเลขานุการและงานสารบรรณ สรุปผลการดำเนินงานและมติที่ประชุม", status: "published", version: 1, prepared_by: userIds.reporter, reviewed_by: userIds.reviewer, reviewed_at: "2026-08-21T09:00:00.000Z", published_at: "2026-08-21T10:00:00.000Z" },
  ];
  await upsert("reports", reports, "id");
  await upsert("report_versions", reports.map((report) => ({ report_id: report.id, version_number: report.version, content: report.content, plain_text: report.plain_text, created_by: report.prepared_by })), "report_id,version_number");
  const existingReview = await supabase.from("report_reviews").select("id").eq("report_id", reports[1].id).eq("reviewer_id", userIds.reviewer).eq("decision", "approved").maybeSingle();
  if (existingReview.error) throw existingReview.error;
  if (!existingReview.data) await upsert("report_reviews", { report_id: reports[1].id, reviewer_id: userIds.reviewer, decision: "approved", comment: "ตรวจทานแล้ว สามารถเผยแพร่ได้" });

  const docs = [
    { meeting: meetings[0], name: "รายงานการประชุมคณะกรรมการบริหาร ครั้งที่ 8-2569.pdf", category: "report", title: "รายงานการประชุม" },
    { meeting: meetings[2], name: "ระเบียบวาระการประชุมฝ่ายเลขานุการ.pdf", category: "agenda", title: "ระเบียบวาระ" },
    { meeting: meetings[1], name: "เอกสารประกอบวาระ แผนงานไตรมาส 3.pdf", category: "supporting_document", title: "เอกสารประกอบวาระ" },
  ];
  for (const doc of docs) {
    const storagePath = `${organizationId}/${doc.meeting.id}/seed-${doc.category}.pdf`;
    const bytes = pdfBytes(doc.title, `เอกสารตัวอย่างของ ${doc.meeting.title}`);
    const uploaded = await supabase.storage.from("meeting-files").upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
    if (uploaded.error) throw uploaded.error;
    await upsert("attachments", { organization_id: organizationId, meeting_id: doc.meeting.id, file_name: doc.name, storage_path: storagePath, mime_type: "application/pdf", file_size: bytes.byteLength, category: doc.category, document_date: doc.meeting.meeting_date, uploaded_by: userIds.reporter }, "storage_path");
  }

  const existingAudit = await supabase.from("audit_logs").select("id").eq("organization_id", organizationId).eq("action", "seed_demo_initialized").limit(1).maybeSingle();
  if (existingAudit.error) throw existingAudit.error;
  if (!existingAudit.data) await upsert("audit_logs", { organization_id: organizationId, actor_id: userIds.admin, action: "seed_demo_initialized", entity_type: "organization", entity_id: organizationId, metadata: { source: "scripts/seed-demo.mjs", user_password: "configured" } });
  console.log("MeetFlow demo data พร้อมใช้งานแล้ว");
  console.table(users.map((item) => ({ email: item.email, role: item.role, password })));
}

seed().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
