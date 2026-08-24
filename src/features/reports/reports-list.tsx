"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, FilePenLine, FileText, Search } from "lucide-react";
import { Pagination } from "@/components/data/pagination";
import { ReportEditorDialog } from "@/components/report-editor-dialog";
import { saveReportAction } from "@/app/actions/meetings";
import type { AppRole, ReportView } from "@/lib/meetflow-data";

const PAGE_SIZE = 7;
const statusLabels: Record<ReportView["status"], string> = {
  draft: "ฉบับร่าง",
  in_review: "รอตรวจทาน",
  approved: "อนุมัติแล้ว",
  published: "เผยแพร่แล้ว",
};

export function ReportsList({ reports, role }: { reports: ReportView[]; role: AppRole | null }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ReportView | null>(null);
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => reports.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) && (status === "ทั้งหมด" || item.status === status)), [reports, query, status]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };

  return <>
    <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e5eaf1] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e99aa]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหารายงานการประชุม" className="h-10 w-full rounded-lg border border-[#dbe1eb] pl-10 pr-3 text-sm outline-none focus:border-[#8aaef0] focus:ring-3 focus:ring-[#e8effd]" /></div>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-[#dbe1eb] bg-white px-3 text-sm text-[#56647a]"><option value="ทั้งหมด">ทุกสถานะ</option><option value="draft">ฉบับร่าง</option><option value="in_review">รอตรวจทาน</option><option value="approved">อนุมัติแล้ว</option><option value="published">เผยแพร่แล้ว</option></select>
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left">
          <thead><tr className="border-b border-[#e7ebf1] bg-[#f9fafc] text-[11px] font-bold uppercase tracking-wide text-[#7c889b]"><th className="px-5 py-3.5">รายงาน</th><th className="px-4 py-3.5">ผู้จัดทำ</th><th className="px-4 py-3.5">แก้ไขล่าสุด</th><th className="px-4 py-3.5">สถานะ</th><th className="px-4 py-3.5">ดำเนินการ</th></tr></thead>
          <tbody className="divide-y divide-[#e9edf3]">{rows.map((item) => <tr key={item.id} className="hover:bg-[#f8faff]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf3ff] text-[#3264b8]"><FileText className="h-4 w-4" /></span><div className="min-w-0"><Link href={`/meetings/${item.meetingId}`} className="block truncate text-sm font-semibold text-[#2e3b52] hover:text-[#2563eb]">{item.title}</Link><p className="mt-1 text-[11px] text-[#8a95a7]">เวอร์ชัน {item.version}</p></div></div></td><td className="px-4 py-4 text-sm text-[#56647a]">{item.preparedBy}</td><td className="px-4 py-4 text-xs text-[#788499]">{item.updatedAt}</td><td className="px-4 py-4"><ReportStatus status={item.status} /></td><td className="px-4 py-4"><div className="flex gap-1">{["admin", "chair", "reporter"].includes(role ?? "") && item.status !== "published" && <button onClick={() => setEditing(item)} className="rounded-md p-2 text-[#6f7d93] hover:bg-[#eaf1ff] hover:text-[#2563eb]" title="แก้ไข"><FilePenLine className="h-4 w-4" /></button>}<Link href={`/print/reports/${item.meetingId}`} target="_blank" className="rounded-md p-2 text-[#6f7d93] hover:bg-[#eaf1ff] hover:text-[#2563eb]" title="ดาวน์โหลด PDF"><Download className="h-4 w-4" /></Link></div></td></tr>)}</tbody>
        </table>
      </div>
      <div className="divide-y divide-[#e8ecf2] sm:hidden">{rows.map((item) => <div key={item.id} className="p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf3ff] text-[#3264b8]"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2e3b52]">{item.title}</p><p className="mt-1 text-xs text-[#8a95a7]">{item.preparedBy}</p></div><ReportStatus status={item.status} /></div></div>)}</div>
      {!rows.length && <div className="grid min-h-64 place-items-center px-5 text-center text-sm text-[#7d899b]">ยังไม่มีรายงานที่ตรงกับเงื่อนไข</div>}
      <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
    {editing && <ReportEditorDialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} title={editing.title} initialContent={editing.content} onSave={(content, plainText) => { void saveReportAction({ reportId: editing.id, meetingId: editing.meetingId, content, plainText }).then((result) => notify(result.ok ? "บันทึกร่างรายงานแล้ว" : result.error)); }} />}
    {toast && <Toast message={toast} />}
  </>;
}

function ReportStatus({ status }: { status: ReportView["status"] }) {
  const className = status === "published" ? "bg-[#edf1f5] text-[#58677d]" : status === "in_review" ? "bg-[#f3edff] text-[#7042ae]" : status === "approved" ? "bg-[#e8f7f1] text-[#23725c]" : "bg-[#fff5df] text-[#92661d]";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>{statusLabels[status]}</span>;
}

function Toast({ message }: { message: string }) {
  return <div className="toast-in fixed bottom-5 right-5 z-[80] rounded-xl border border-[#c8d9f8] bg-white px-4 py-3 text-sm font-semibold text-[#2b5ca9] shadow-xl">{message}</div>;
}
