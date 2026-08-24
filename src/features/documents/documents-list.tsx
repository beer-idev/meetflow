"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, FileSpreadsheet, FileText, Filter, Link2, Search, Upload, X } from "lucide-react";
import { Pagination } from "@/components/data/pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getDocumentDownloadUrlAction, getDocumentViewUrlAction, grantDocumentPermissionsAction, uploadDocumentAction } from "@/app/actions/meetings";
import type { DocumentView, MeetingListItem, MemberOption } from "@/lib/meetflow-data";

const PAGE_SIZE = 8;

export function DocumentsList({ documents, members }: { documents: DocumentView[]; members: MemberOption[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [department, setDepartment] = useState("ทุกหน่วยงาน");
  const [period, setPeriod] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const [shareDocument, setShareDocument] = useState<DocumentView | null>(null);
  const [toast, setToast] = useState("");
  const [isPending, startTransition] = useTransition();
  const categories = useMemo(() => Array.from(new Set(documents.map((item) => item.category))), [documents]);
  const departments = useMemo(() => Array.from(new Set(documents.map((item) => item.department))), [documents]);

  const filtered = useMemo(() => documents.filter((item) => {
    const matchesQuery = `${item.name} ${item.meeting}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "ทั้งหมด" || item.category === category;
    const matchesDepartment = department === "ทุกหน่วยงาน" || item.department === department;
    const matchesPeriod = period === "ทั้งหมด" || item.createdAt.startsWith(period);
    return matchesQuery && matchesCategory && matchesDepartment && matchesPeriod;
  }), [documents, query, category, department, period]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const update = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  const openDocument = (documentId: string) => startTransition(async () => {
    const result = await getDocumentViewUrlAction(documentId);
    if (!result.ok) return notify(result.error);
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  });
  const downloadDocument = (documentId: string) => startTransition(async () => {
    const result = await getDocumentDownloadUrlAction(documentId);
    if (!result.ok) return notify(result.error);
    window.location.assign(result.data.url);
  });

  return <>
    <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
      <div className="border-b border-[#e5eaf1] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1 xl:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e99aa]" />
            <input value={query} onChange={(event) => update(setQuery, event.target.value)} placeholder="ค้นหาชื่อไฟล์ รายงาน หรือคำสำคัญ" className="h-10 w-full rounded-lg border border-[#dbe1eb] pl-10 pr-3 text-sm outline-none focus:border-[#8aaef0] focus:ring-3 focus:ring-[#e8effd]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="flex h-10 items-center gap-2 rounded-lg border border-[#dbe1eb] bg-[#f8fafc] px-3 text-xs font-semibold text-[#6c788c]"><Filter className="h-3.5 w-3.5" />จัดหมวดหมู่</span>
            <Select value={category} onChange={(value) => update(setCategory, value)} options={["ทั้งหมด", ...categories]} />
            <Select value={period} onChange={(value) => update(setPeriod, value)} options={["ทั้งหมด", "2026", "2025", "2024"]} />
            <Select value={department} onChange={(value) => update(setDepartment, value)} options={["ทุกหน่วยงาน", ...departments]} />
            {(query || category !== "ทั้งหมด" || department !== "ทุกหน่วยงาน" || period !== "ทั้งหมด") && <button onClick={() => { setQuery(""); setCategory("ทั้งหมด"); setDepartment("ทุกหน่วยงาน"); setPeriod("ทั้งหมด"); setPage(1); }} className="flex h-10 items-center gap-1 px-2 text-xs font-semibold text-[#68758b]"><X className="h-3.5 w-3.5" />ล้าง</button>}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead><tr className="border-b border-[#e7ebf1] bg-[#f9fafc] text-[11px] font-bold uppercase tracking-wide text-[#7c889b]"><th className="px-5 py-3.5">ชื่อเอกสาร</th><th className="px-4 py-3.5">หมวดหมู่</th><th className="px-4 py-3.5">หน่วยงาน</th><th className="px-4 py-3.5">แก้ไขล่าสุด</th><th className="px-4 py-3.5">ขนาด</th><th className="w-24 px-4 py-3.5">ดำเนินการ</th></tr></thead>
          <tbody className="divide-y divide-[#e9edf3]">{rows.map((file) => <tr key={file.id} className="hover:bg-[#f8faff]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-lg ${file.extension === "XLSX" ? "bg-emerald-50 text-emerald-700" : "bg-[#edf3ff] text-[#3264b8]"}`}>{file.extension === "XLSX" ? <FileSpreadsheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><div className="min-w-0"><button onClick={() => openDocument(file.id)} className="block max-w-md truncate text-left text-sm font-semibold text-[#2e3b52] hover:text-[#2563eb] hover:underline" disabled={isPending}>{file.name}</button><p className="mt-1 max-w-md truncate text-[11px] text-[#8a95a7]">{file.meeting}</p></div></div></td><td className="px-4 py-4 text-xs text-[#657288]">{file.category}</td><td className="px-4 py-4 text-xs text-[#657288]">{file.department}</td><td className="px-4 py-4 text-xs text-[#7f8a9d]">{file.updatedAt}</td><td className="px-4 py-4 text-xs text-[#7f8a9d]">{file.size}</td><td className="px-4 py-4"><div className="flex gap-1"><button title="แชร์" onClick={() => setShareDocument(file)} className="rounded-md p-2 text-[#758299] hover:bg-[#eaf1ff] hover:text-[#2563eb]"><Link2 className="h-4 w-4" /></button><button title="ดาวน์โหลด" onClick={() => downloadDocument(file.id)} className="rounded-md p-2 text-[#758299] hover:bg-[#eaf1ff] hover:text-[#2563eb]" disabled={isPending}><Download className="h-4 w-4" /></button></div></td></tr>)}</tbody>
        </table>
      </div>
      {!rows.length && <div className="grid min-h-64 place-items-center px-5 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf2fa] text-[#6580ab]"><FileText className="h-5 w-5" /></span><p className="mt-3 font-semibold text-[#344159]">ยังไม่มีเอกสารที่ตรงกับเงื่อนไข</p><p className="mt-1 text-sm text-[#8490a2]">อัปโหลดเอกสารจริงผ่านปุ่มด้านบน ข้อมูลจะเข้า Supabase Storage และตาราง attachments</p></div></div>}
      <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
    <SharePermissionDialog document={shareDocument} members={members} onClose={() => setShareDocument(null)} notify={notify} />
    {toast && <div className="toast-in fixed bottom-5 right-5 z-50 rounded-xl border border-[#c8d9f8] bg-white px-4 py-3 text-sm font-semibold text-[#2b5ca9] shadow-xl">{toast}</div>}
  </>;
}

export function UploadButton({ meetings }: { meetings: MeetingListItem[] }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    setMessage("");
    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("อัปโหลดเอกสารแล้ว");
      setOpen(false);
    });
  };

  return <>
    <Button onClick={() => setOpen(true)}><Upload className="h-4 w-4" />อัปโหลดเอกสาร</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[520px]">
        <div className="border-b border-[#e5e9f1] px-6 py-5">
          <DialogTitle className="text-lg font-bold text-[#24324a]">อัปโหลดเอกสาร</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#7c889c]">ไฟล์จะถูกเก็บใน Supabase Storage แบบ private และผูกกับการประชุมที่เลือก</DialogDescription>
        </div>
        <form action={submit} className="space-y-4 px-6 py-5">
          <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">การประชุม</span><select name="meetingId" required className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm">{meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.title}</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">หมวดหมู่</span><select name="category" className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm"><option value="supporting_document">เอกสารประกอบ</option><option value="agenda">ระเบียบวาระ</option><option value="report">รายงานการประชุม</option><option value="invitation">หนังสือเชิญ</option></select></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">ไฟล์</span><input name="file" type="file" required className="block w-full rounded-lg border border-[#d9e0ea] px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#edf3ff] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#245bb8]" /></label>
          {message && <p className="rounded-lg bg-[#fff0eb] px-3 py-2 text-sm font-semibold text-[#b84a24]">{message}</p>}
          <div className="flex justify-end gap-2 border-t border-[#e7ebf1] pt-4"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={isPending}>{isPending ? "กำลังอัปโหลด..." : "อัปโหลด"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

function SharePermissionDialog({ document, members, onClose, notify }: { document: DocumentView | null; members: MemberOption[]; onClose: () => void; notify: (message: string) => void }) {
  const [userIds, setUserIds] = useState<string[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [access, setAccess] = useState("view");
  const [isPending, startTransition] = useTransition();
  const filteredMembers = useMemo(() => members.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(memberQuery.toLowerCase())), [members, memberQuery]);
  const submit = () => {
    if (!document || !userIds.length) return notify("กรุณาเลือกผู้ใช้งานอย่างน้อย 1 คน");
    startTransition(async () => {
      const result = await grantDocumentPermissionsAction(document.meetingId, userIds, access);
      if (!result.ok) return notify(result.error);
      notify("กำหนดสิทธิ์เอกสารแล้ว");
      onClose();
    });
  };

  return <Dialog open={Boolean(document)} onOpenChange={(open) => { if (!open) { setUserIds([]); setMemberQuery(""); onClose(); } }}>
    <DialogContent className="max-w-[520px]">
      <div className="border-b border-[#e5e9f1] px-6 py-5"><DialogTitle className="text-lg font-bold text-[#24324a]">แชร์เอกสาร</DialogTitle><DialogDescription className="mt-1 text-sm text-[#7c889c]">{document?.name}</DialogDescription></div>
      <div className="space-y-4 px-6 py-5">
        <div><span className="mb-2 block text-sm font-semibold text-[#3a465c]">ผู้ที่ต้องเห็นเอกสาร (เลือกได้หลายคน)</span><input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" className="mb-2 h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm" /><div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-[#d9e0ea] p-2">{filteredMembers.map((member) => <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-[#f5f8ff]"><input type="checkbox" checked={userIds.includes(member.id)} onChange={(event) => setUserIds((current) => event.target.checked ? Array.from(new Set([...current, member.id])) : current.filter((id) => id !== member.id))} className="h-4 w-4 accent-[#3657e8]" /><span><span className="block text-sm font-semibold text-[#344159]">{member.name}</span><span className="block text-xs text-[#8995a7]">{member.email}</span></span></label>)}{!filteredMembers.length && <p className="px-2 py-3 text-sm text-[#8995a7]">ไม่พบผู้ใช้งาน</p>}</div></div>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">สิทธิ์</span><select value={access} onChange={(event) => setAccess(event.target.value)} className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm"><option value="view">อ่านและดาวน์โหลด</option><option value="edit">อ่าน แก้ไข และดาวน์โหลด</option><option value="manage">จัดการสิทธิ์</option></select></label>
        <div className="flex justify-end gap-2 border-t border-[#e7ebf1] pt-4"><Button type="button" variant="secondary" onClick={onClose}>ยกเลิก</Button><Button type="button" disabled={isPending} onClick={submit}>{isPending ? "กำลังบันทึก..." : `บันทึกสิทธิ์${userIds.length ? ` (${userIds.length} คน)` : ""}`}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-[#dbe1eb] bg-white px-3 text-sm text-[#56647a]">{options.map((option) => <option key={option}>{option}</option>)}</select>;
}
