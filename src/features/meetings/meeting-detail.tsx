"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, Copy, Download, Eye, FilePenLine, FileText, Link2, ListChecks, MapPin, Paperclip, Pencil, ShieldCheck, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { ReportEditorDialog } from "@/components/report-editor-dialog";
import { AgendaManager } from "@/features/meetings/agenda-manager";
import { MeetingWorkflowControl } from "@/features/meetings/meeting-workflow-control";
import { addParticipantAction, createShareLinkAction, getDocumentDownloadUrlAction, getDocumentViewUrlAction, grantDocumentPermissionAction, saveReportAction, uploadDocumentAction } from "@/app/actions/meetings";
import { cn } from "@/lib/utils";
import type { AppRole, MeetingDetailView, MemberOption } from "@/lib/meetflow-data";

type Tab = "overview" | "agenda" | "participants" | "documents" | "minutes" | "permissions";
const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [{ id: "overview", label: "ภาพรวม", icon: FilePenLine }, { id: "agenda", label: "ระเบียบวาระ", icon: ListChecks }, { id: "participants", label: "ผู้เข้าร่วม", icon: Users }, { id: "documents", label: "เอกสาร", icon: Paperclip }, { id: "minutes", label: "รายงานการประชุม", icon: FilePenLine }, { id: "permissions", label: "สิทธิ์การเข้าถึง", icon: ShieldCheck }];

export function MeetingDetail({ detail, members, role }: { detail: MeetingDetailView; members: MemberOption[]; role: AppRole }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [editorOpen, setEditorOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState("");
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };

  const canEdit = ["admin", "chair", "reporter"].includes(role);
  const canManage = ["admin", "chair", "reporter"].includes(role);
  const visibleTabs = tabs.filter((item) => item.id !== "permissions" || canManage);

  return <>
    <div className="mb-5"><Link href="/meetings" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#68768d] hover:text-[#2563eb]"><ArrowLeft className="h-4 w-4" />กลับไปรายการประชุม</Link></div>
    <section className="overflow-hidden rounded-xl border border-[#dce3ed] bg-white">
      <div className="px-5 py-5 sm:px-7 sm:py-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={detail.status} /><span className="text-xs font-semibold text-[#7d899c]">{detail.type}</span></div><h1 className="mt-2 text-xl font-bold leading-8 text-[#17243c] sm:text-2xl">{detail.title}</h1><p className="mt-1 text-sm text-[#78859a]">รับผิดชอบโดย {detail.department} · ผู้จัดทำ {detail.owner}</p></div><div className="flex flex-wrap gap-2">{canManage && <Button variant="secondary" onClick={() => setShareOpen(true)}><Link2 className="h-4 w-4" />แชร์</Button>}<Button variant="secondary" asChild><Link href={`/print/reports/${detail.id}`} target="_blank"><Download className="h-4 w-4" />ดาวน์โหลด PDF</Link></Button>{canEdit && <Button onClick={() => setEditorOpen(true)}><Pencil className="h-4 w-4" />แก้ไขรายงาน</Button>}</div></div></div>
      <div className="grid border-y border-[#e4e9f1] bg-[#fafbfc] sm:grid-cols-2 lg:grid-cols-4"><Info icon={CalendarDays} label="วันที่" value={formatDate(detail.date)} /><Info icon={Clock3} label="เวลา" value={`${detail.time}–${detail.endTime} น.`} /><Info icon={MapPin} label="สถานที่" value={detail.onlineUrl ? <a href={detail.onlineUrl} target="_blank" rel="noreferrer" className="text-[#2563eb] hover:underline">{detail.location || "เข้าร่วมออนไลน์"} ↗</a> : (detail.location || "ไม่ระบุสถานที่")} /><Info icon={Users} label="ผู้เข้าร่วม" value={`${detail.participantCount} คน`} last /></div>
      <div className="soft-scrollbar flex overflow-x-auto px-3 sm:px-5">{visibleTabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cn("flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-semibold transition", tab === id ? "border-[#2563eb] text-[#245cbd]" : "border-transparent text-[#758196] hover:text-[#35445d]")}><Icon className="h-4 w-4" />{label}</button>)}</div>
    </section>

    <div className="mt-6">
      {tab === "overview" && <Overview detail={detail} onTab={setTab} onEdit={() => setEditorOpen(true)} canEdit={canEdit} canManage={canManage} notify={notify} />}
      {tab === "agenda" && <AgendaManager meetingId={detail.id} items={detail.agenda} canEdit={canEdit} notify={notify} />}
      {tab === "participants" && <Participants detail={detail} members={members} notify={notify} canManage={canManage} />}
      {tab === "documents" && <Documents detail={detail} notify={notify} canManage={canManage} />}
      {tab === "minutes" && <Minutes detail={detail} onEdit={() => setEditorOpen(true)} onShare={() => setShareOpen(true)} canEdit={canEdit} canManage={canManage} />}
      {tab === "permissions" && <Permissions detail={detail} members={members} notify={notify} />}
    </div>

    {canEdit && <ReportEditorDialog open={editorOpen} onOpenChange={setEditorOpen} title={detail.title} initialContent={detail.report?.content} onSave={(content, plainText) => { void saveReportAction({ reportId: detail.report?.id ?? null, meetingId: detail.id, content, plainText }).then((result) => notify(result.ok ? "บันทึกร่างรายงานแล้ว" : result.error)); }} />}
    {canManage && <ShareDialog meetingId={detail.id} open={shareOpen} onOpenChange={setShareOpen} notify={notify} />}
    {toast && <div className="toast-in fixed bottom-5 right-5 z-[80] flex items-center gap-2.5 rounded-xl border border-[#bfd6ff] bg-white px-4 py-3 text-sm font-semibold text-[#2858a6] shadow-xl"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#2563eb] text-white"><Check className="h-3 w-3" /></span>{toast}</div>}
  </>;
}

function Overview({ detail, onTab, onEdit, canEdit, canManage, notify }: { detail: MeetingDetailView; onTab: (tab: Tab) => void; onEdit: () => void; canEdit: boolean; canManage: boolean; notify: (message: string) => void }) {
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]"><div className="space-y-6">{canEdit && <div className="flex flex-col gap-4 rounded-xl border border-[#cddcf7] bg-[#f3f7ff] p-5 sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#2e64bd] shadow-sm"><FilePenLine className="h-5 w-5" /></span><div className="flex-1"><p className="font-bold text-[#273b61]">ขั้นตอนถัดไป: จัดทำรายงานการประชุม</p><p className="mt-1 text-sm text-[#637493]">บันทึกสาระสำคัญและมติของแต่ละระเบียบวาระก่อนส่งตรวจทาน</p></div><Button onClick={onEdit}>เริ่มเขียนรายงาน</Button></div>}<Panel title="ระเบียบวาระ" description={`${detail.agenda.length} หัวข้อ`} action="ดูทั้งหมด" onAction={() => onTab("agenda")}><div className="divide-y divide-[#e8ecf2]">{detail.agenda.slice(0, 4).map((item) => <AgendaRow key={item.id} index={item.position} title={item.title} status={item.resolution ? "บันทึกมติแล้ว" : "รอบันทึกมติ"} />)}{!detail.agenda.length && <Empty text="ยังไม่มีระเบียบวาระ" />}</div></Panel><Panel title="เอกสารประกอบ" description={`${detail.documents.length} ไฟล์`} action="จัดการเอกสาร" onAction={() => onTab("documents")}><FileRows documents={detail.documents} /></Panel></div><div className="space-y-6">{canManage && <MeetingWorkflowControl meetingId={detail.id} value={detail.status} notify={notify} />}<Panel title="ผู้เข้าร่วมประชุม" description={`${detail.participants.length} คน`} action="ดูรายชื่อ" onAction={() => onTab("participants")}><div className="px-5 pb-5"><div className="flex -space-x-2">{detail.participants.slice(0, 5).map((person) => <span key={person.id} title={person.name} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#dfe9fc] text-[10px] font-bold text-[#315f9f]">{person.initials}</span>)}{detail.participants.length > 5 && <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#eff2f6] text-[10px] font-bold text-[#65738a]">+{detail.participants.length - 5}</span>}</div></div></Panel><Panel title="ข้อมูลการจัดทำรายงาน" description="สถานะและผู้รับผิดชอบ"><div className="space-y-4 px-5 pb-5"><LabelValue label="ผู้จัดทำ" value={detail.report?.preparedBy ?? detail.owner} /><LabelValue label="สถานะรายงาน" value={detail.report ? reportStatus(detail.report.status) : "ยังไม่มีรายงาน"} /><LabelValue label="เวอร์ชัน" value={detail.report ? `v${detail.report.version}` : "-"} /></div></Panel></div></div>;
}

function Participants({ detail, members, notify, canManage }: { detail: MeetingDetailView; members: MemberOption[]; notify: (message: string) => void; canManage: boolean }) {
  const [userId, setUserId] = useState("");
  const [isPending, startTransition] = useTransition();
  const available = members.filter((member) => !detail.participants.some((participant) => participant.id === member.id));
  const add = () => {
    if (!userId) return notify("กรุณาเลือกผู้เข้าร่วม");
    startTransition(async () => {
      const result = await addParticipantAction(detail.id, userId);
      if (!result.ok) return notify(result.error);
      notify("เพิ่มผู้เข้าร่วมแล้ว");
    });
  };
  return <Panel title="ผู้เข้าร่วมประชุม" description={`${detail.participants.length} คน`} action={canManage ? "เพิ่มผู้เข้าร่วม" : undefined} onAction={add}>{canManage && <div className="border-b border-[#e7ebf1] px-5 py-4 sm:px-6"><div className="flex gap-2"><select value={userId} onChange={(event) => setUserId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-[#d9e0ea] px-3 text-sm"><option value="">เลือกผู้ใช้งานในองค์กร</option>{available.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.email})</option>)}</select><Button type="button" onClick={add} disabled={isPending}>เพิ่ม</Button></div></div>}<div className="divide-y divide-[#e8ecf2]">{detail.participants.map((person) => <div key={person.id} className="flex items-center gap-3 px-5 py-4 sm:px-6"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e2ebfc] text-[10px] font-bold text-[#315f9f]">{person.initials}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#334057]">{person.name}</p><p className="truncate text-xs text-[#8b95a6]">{person.email} · {person.department}</p></div><span className="hidden rounded-full bg-[#f0f3f7] px-2.5 py-1 text-[10px] font-bold text-[#657187] sm:inline">{person.meetingRole === "chair" ? "ประธาน" : person.meetingRole === "reporter" ? "ผู้จดรายงาน" : "ผู้เข้าร่วม"}</span><span className="text-xs font-semibold text-[#2c7a61]">{attendanceLabel(person.attendanceStatus)}</span></div>)}</div></Panel>;
}

function Documents({ detail, notify, canManage }: { detail: MeetingDetailView; notify: (message: string) => void; canManage: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("supporting_document");
  const [isPending, startTransition] = useTransition();
  const open = (documentId: string) => getDocumentViewUrlAction(documentId).then((result) => result.ok ? window.open(result.data.url, "_blank", "noopener,noreferrer") : notify(result.error));
  const download = (documentId: string) => getDocumentDownloadUrlAction(documentId).then((result) => result.ok ? window.location.assign(result.data.url) : notify(result.error));
  const upload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return notify("กรุณาเลือกไฟล์ที่ต้องการอัปโหลด");
    const formData = new FormData();
    formData.set("meetingId", detail.id);
    formData.set("category", category);
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (!result.ok) return notify(result.error);
      if (inputRef.current) inputRef.current.value = "";
      notify("อัปโหลดเอกสารแล้ว");
      router.refresh();
    });
  };
  return <Panel title="เอกสารทั้งหมด" description={`${detail.documents.length} ไฟล์ · จัดเก็บใน Supabase Storage`}>{canManage && <div className="border-b border-[#e7ebf1] bg-[#fbfcfe] px-5 py-4 sm:px-6"><div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto]"><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-lg border border-[#d9e0ea] bg-white px-3 text-sm text-[#4d5a70]"><option value="supporting_document">เอกสารประกอบ</option><option value="agenda">ระเบียบวาระ</option><option value="invitation">หนังสือเชิญ</option><option value="report">รายงานการประชุม</option></select><input ref={inputRef} type="file" className="block h-10 w-full rounded-lg border border-[#d9e0ea] bg-white text-sm text-[#59667a] file:mr-3 file:h-full file:border-0 file:border-r file:border-[#e2e7ef] file:bg-[#f3f6fb] file:px-4 file:text-sm file:font-semibold file:text-[#355f9f]" /><Button type="button" onClick={upload} disabled={isPending}><Upload className="h-4 w-4" />{isPending ? "กำลังอัปโหลด..." : "อัปโหลดเอกสาร"}</Button></div><p className="mt-2 text-xs text-[#8994a6]">รองรับไฟล์ทั่วไป ขนาดไม่เกิน 50 MB</p></div>}<FileRows documents={detail.documents} onOpen={open} onDownload={download} /></Panel>;
}

function Minutes({ detail, onEdit, onShare, canEdit, canManage }: { detail: MeetingDetailView; onEdit: () => void; onShare: () => void; canEdit: boolean; canManage: boolean }) {
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><Panel title="รายงานการประชุม" description={detail.report ? `แก้ไขล่าสุด ${detail.report.updatedAt}` : "ยังไม่มีรายงาน"} action={canEdit ? "แก้ไขรายงาน" : undefined} onAction={onEdit}><div className="px-6 pb-7 text-sm leading-7 text-[#56647a] whitespace-pre-line">{detail.report?.plainText || "ยังไม่มีเนื้อหารายงาน"}</div></Panel><div className="space-y-4"><div className="rounded-xl border border-[#dfe5ef] bg-white p-5"><h3 className="font-bold text-[#29364c]">การดำเนินการ</h3><div className="mt-4 space-y-2">{canEdit && <Button className="w-full" onClick={onEdit}><FilePenLine className="h-4 w-4" />แก้ไขรายงาน</Button>}<Button variant="secondary" className="w-full" asChild><Link href={`/print/reports/${detail.id}`} target="_blank"><Download className="h-4 w-4" />ดาวน์โหลด PDF</Link></Button>{canManage && <Button variant="secondary" className="w-full" onClick={onShare}><Link2 className="h-4 w-4" />แชร์ลิงก์</Button>}</div></div></div></div>;
}

function Permissions({ detail, members, notify }: { detail: MeetingDetailView; members: MemberOption[]; notify: (message: string) => void }) {
  const [userId, setUserId] = useState("");
  const [access, setAccess] = useState("view");
  const [isPending, startTransition] = useTransition();
  const grant = () => {
    if (!userId) return notify("กรุณาเลือกผู้ใช้งาน");
    startTransition(async () => {
      const result = await grantDocumentPermissionAction(detail.id, userId, access);
      if (!result.ok) return notify(result.error);
      notify("บันทึกสิทธิ์แล้ว");
    });
  };
  return <Panel title="สิทธิ์การเข้าถึง" description="กำหนดสิทธิ์ตามผู้เกี่ยวข้อง"><div className="border-b border-[#e7ebf1] px-5 py-4 sm:px-6"><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]"><select value={userId} onChange={(event) => setUserId(event.target.value)} className="h-10 rounded-lg border border-[#d9e0ea] px-3 text-sm"><option value="">เลือกผู้ใช้งาน</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><select value={access} onChange={(event) => setAccess(event.target.value)} className="h-10 rounded-lg border border-[#d9e0ea] px-3 text-sm"><option value="view">อ่าน</option><option value="edit">แก้ไข</option><option value="manage">จัดการ</option></select><Button onClick={grant} disabled={isPending}>บันทึกสิทธิ์</Button></div></div><div className="divide-y divide-[#e8ecf2]">{detail.permissions.map((person) => <div key={person.id} className="flex items-center gap-4 px-5 py-4 sm:px-6"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf3ff] text-[#3165bb]"><Eye className="h-4 w-4" /></span><div className="flex-1"><p className="text-sm font-semibold text-[#344158]">{person.name}</p><p className="mt-1 text-xs text-[#8994a6]">{person.email}</p></div><span className="text-xs font-semibold text-[#315eaa]">{accessLabel(person.access)}</span></div>)}</div></Panel>;
}

function ShareDialog({ meetingId, open, onOpenChange, notify }: { meetingId: string; open: boolean; onOpenChange: (open: boolean) => void; notify: (message: string) => void }) {
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const create = () => startTransition(async () => {
    const result = await createShareLinkAction(meetingId);
    if (!result.ok) return notify(result.error);
    setUrl(`${window.location.origin}${result.data.url}`);
  });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-[520px]"><div className="border-b border-[#e5e9f1] px-6 py-5"><DialogTitle className="text-lg font-bold text-[#24324a]">แชร์รายงานการประชุม</DialogTitle><DialogDescription className="mt-1 text-sm text-[#7c889c]">สร้างลิงก์สาธารณะแบบอ่านอย่างเดียว อายุ 7 วัน ผู้รับลิงก์เปิดอ่านและบันทึกเป็น PDF ได้โดยไม่ต้องเข้าสู่ระบบ</DialogDescription></div><div className="space-y-5 px-6 py-5"><Button onClick={create} disabled={isPending}>{isPending ? "กำลังสร้าง..." : "สร้างลิงก์แชร์"}</Button>{url && <div className="flex items-center gap-2 rounded-lg bg-[#f4f7fb] p-2"><input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#5a687e] outline-none" /><Button size="sm" onClick={() => { navigator.clipboard?.writeText(url); notify("คัดลอกลิงก์แล้ว"); }}><Copy className="h-4 w-4" />คัดลอก</Button></div>}</div></DialogContent></Dialog>;
}

function Panel({ title, description, action, onAction, children }: { title: string; description: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white"><div className="flex items-center justify-between gap-3 border-b border-[#e7ebf1] px-5 py-4 sm:px-6"><div><h2 className="font-bold text-[#28354c]">{title}</h2><p className="mt-0.5 text-xs text-[#8792a5]">{description}</p></div>{action && <button onClick={onAction} className="flex items-center gap-1 text-xs font-semibold text-[#2563eb]">{action}<ChevronRight className="h-3.5 w-3.5" /></button>}</div>{children}</section>; }
function Info({ icon: Icon, label, value, last }: { icon: LucideIcon; label: string; value: ReactNode; last?: boolean }) { return <div className={cn("flex items-center gap-3 px-5 py-3.5", !last && "border-b border-[#e7ebf1] sm:border-b-0 sm:border-r")}><Icon className="h-4 w-4 text-[#6b83aa]" /><div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#909bad]">{label}</p><p className="mt-0.5 text-sm font-medium text-[#3a475e]">{value}</p></div></div>; }
function AgendaRow({ index, title, status }: { index: number; title: string; status: string }) { return <div className="flex items-center gap-3 px-5 py-3.5"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#eef3fc] text-[11px] font-bold text-[#3b65a8]">{index}</span><p className="flex-1 text-sm font-medium text-[#3a465b]">{title}</p><span className={`text-[10px] font-semibold ${status === "รอบันทึกมติ" ? "text-amber-700" : "text-emerald-700"}`}>{status}</span></div>; }
function FileRows({ documents, onOpen, onDownload }: { documents: MeetingDetailView["documents"]; onOpen?: (documentId: string) => void; onDownload?: (documentId: string) => void }) { return <div className="divide-y divide-[#e8ecf2]">{documents.map((file) => <div key={file.id} className="flex items-center gap-3 px-5 py-3.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf3ff] text-[#3264b8]"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><button onClick={() => onOpen?.(file.id)} className="truncate text-left text-sm font-medium text-[#344159] hover:text-[#2563eb] hover:underline">{file.name}</button><p className="mt-0.5 text-[11px] text-[#8b95a7]">{file.size} · {file.updatedAt}</p></div><button onClick={() => (onDownload ?? onOpen)?.(file.id)} className="rounded-md p-2 text-[#8d98aa] hover:bg-[#f1f4f8] hover:text-[#2563eb]"><Download className="h-4 w-4" /></button></div>)}{!documents.length && <Empty text="ยังไม่มีเอกสาร" />}</div>; }
function LabelValue({ label, value }: { label: string; value: string }) { return <p className="flex items-center justify-between gap-4 text-xs"><span className="text-[#8994a6]">{label}</span><span className="font-semibold text-[#445167]">{value}</span></p>; }
function Empty({ text }: { text: string }) { return <div className="px-6 py-8 text-center text-sm text-[#7d899b]">{text}</div>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`)); }
function reportStatus(status: string) { return ({ draft: "ฉบับร่าง", in_review: "รอตรวจทาน", approved: "อนุมัติแล้ว", published: "เผยแพร่แล้ว" } as Record<string, string>)[status] ?? status; }
function attendanceLabel(status: string) { return ({ invited: "เชิญแล้ว", accepted: "ตอบรับแล้ว", declined: "ปฏิเสธ", attended: "เข้าร่วม", absent: "ขาดประชุม" } as Record<string, string>)[status] ?? status; }
function accessLabel(access: string) { return ({ view: "อ่าน", edit: "แก้ไข", manage: "จัดการ" } as Record<string, string>)[access] ?? access; }
