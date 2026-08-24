"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { FileClock, FileText, Search, X } from "lucide-react";
import { globalSearchAction, type SearchResult } from "@/app/actions/search";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const container = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const search = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => startTransition(async () => {
      const response = await globalSearchAction(value);
      setResults(response.ok ? response.data : []);
      setSearched(true);
    }), 250);
  };

  return (
    <div ref={container} className="relative w-full max-w-[520px]">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8895a8]" />
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => search(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="ค้นหาการประชุม เอกสาร หรือหน่วยงาน"
        className="h-10 w-full rounded-lg border border-[#dbe1ea] bg-[#f8fafc] pl-10 pr-10 text-sm text-[#26344c] outline-none transition placeholder:text-[#99a4b4] focus:border-[#8eb2f4] focus:bg-white focus:ring-3 focus:ring-[#e4edff]"
      />
      {query && <button aria-label="ล้างคำค้น" onClick={() => search("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#909caf]"><X className="h-4 w-4" /></button>}
      {open && query.trim() && <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-[#dbe2ed] bg-white shadow-xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3"><p className="text-xs font-semibold text-[#68758b]">ผลการค้นหา</p><p className="text-[11px] text-[#96a0b1]">{isPending ? "กำลังค้นหา…" : searched ? `พบ ${results.length} รายการ` : "พิมพ์เพื่อค้นหา"}</p></div>
        {results.length ? <div className="max-h-[390px] overflow-y-auto py-1.5">{results.map((item) => <Result key={`${item.kind}-${item.id}`} item={item} onSelect={() => setOpen(false)} />)}</div> : searched && !isPending ? <div className="px-5 py-8 text-center"><p className="text-sm font-semibold text-[#3b475c]">ไม่พบรายการที่ค้นหา</p><p className="mt-1 text-xs text-[#8994a7]">ลองค้นด้วยชื่อประชุม ชื่อไฟล์ หรือคำสำคัญ</p></div> : null}
      </div>}
    </div>
  );
}

function Result({ item, onSelect }: { item: SearchResult; onSelect: () => void }) {
  const icon = item.kind === "meeting" ? <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eaf1ff] text-[#2861c2]"><Search className="h-4 w-4" /></span> : item.kind === "report" ? <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f3edff] text-[#7545c7]"><FileClock className="h-4 w-4" /></span> : <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f1f4f8] text-[#64748b]"><FileText className="h-4 w-4" /></span>;
  return <Link href={item.href} onClick={onSelect} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f8fd]">{icon}<span className="min-w-0"><span className="block truncate text-sm font-medium text-[#27344a]">{item.title}</span><span className="block truncate text-[11px] text-[#8b95a6]">{item.meta || "MeetFlow"}</span></span></Link>;
}
