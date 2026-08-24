"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Download, FilePenLine, Filter, KeyRound, Link2, LogIn, Search, ShieldCheck, Upload } from "lucide-react";
import { Pagination } from "@/components/data/pagination";
import type { AuditView } from "@/lib/meetflow-data";

const PAGE_SIZE = 8;
const iconMap: Record<string, LucideIcon> = { download: Download, edit: FilePenLine, share: Link2, login: LogIn, permission: KeyRound, upload: Upload, publish: ShieldCheck };

export function AuditList({ logs }: { logs: AuditView[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ทุกกิจกรรม");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => logs.filter((log) => `${log.action} ${log.detail} ${log.user}`.toLowerCase().includes(query.toLowerCase()) && (action === "ทุกกิจกรรม" || log.action === action)), [logs, query, action]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
    <div className="flex flex-col gap-3 border-b border-[#e5eaf1] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e99aa]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหาผู้ใช้งานหรือกิจกรรม" className="h-10 w-full rounded-lg border border-[#dbe1eb] pl-10 pr-3 text-sm outline-none focus:border-[#8aaef0] focus:ring-3 focus:ring-[#e8effd]" /></div>
      <div className="flex gap-2"><span className="flex h-10 items-center gap-1.5 rounded-lg border border-[#dbe1eb] bg-[#f8fafc] px-3 text-xs font-semibold text-[#6c788c]"><Filter className="h-3.5 w-3.5" />กรอง</span><select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-[#dbe1eb] bg-white px-3 text-sm text-[#56647a]"><option>ทุกกิจกรรม</option>{Array.from(new Set(logs.map((log) => log.action))).map((item) => <option key={item}>{item}</option>)}</select></div>
    </div>
    <div className="divide-y divide-[#e9edf3]">{rows.map((log) => { const Icon = iconMap[log.type] ?? ShieldCheck; return <div key={log.id} className="flex gap-4 px-5 py-4 sm:px-6"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf3ff] text-[#3264b8]"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-[#303d54]">{log.action}</p><p className="text-[11px] text-[#8c96a7]">{log.time}</p></div><p className="mt-1 text-sm text-[#667389]">{log.detail}</p><p className="mt-1 text-[11px] text-[#8c96a7]">โดย {log.user}</p></div></div>; })}</div>
    {!rows.length && <div className="grid min-h-64 place-items-center px-5 text-center text-sm text-[#7d899b]">ยังไม่มีประวัติการใช้งาน</div>}
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </div>;
}
