"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Filter, LayoutList, Link2, MapPin, Plus, Search, Users, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/data/pagination";
import { Button } from "@/components/ui/button";
import type { DepartmentOption, MeetingListItem } from "@/lib/meetflow-data";

const PAGE_SIZE = 8;
const selectClass = "h-10 rounded-lg border border-[#dbe1eb] bg-white px-3 text-sm text-[#526078] outline-none focus:border-[#8aaff0] focus:ring-3 focus:ring-[#e8effd]";

export function MeetingsList({ meetings, departments }: { meetings: MeetingListItem[]; departments: DepartmentOption[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ทั้งหมด");
  const [department, setDepartment] = useState("ทุกหน่วยงาน");
  const [period, setPeriod] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => monthKey(new Date()));

  const types = useMemo(() => Array.from(new Set(meetings.map((meeting) => meeting.type))).filter(Boolean), [meetings]);
  const periods = useMemo(() => Array.from(new Set(meetings.map((meeting) => meeting.date.slice(0, 7)))).sort().reverse(), [meetings]);

  const filtered = useMemo(() => meetings.filter((meeting) => {
    const matchesQuery = `${meeting.title} ${meeting.location} ${meeting.onlineUrl ?? ""} ${meeting.department}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesType = type === "ทั้งหมด" || meeting.type === type;
    const matchesDepartment = department === "ทุกหน่วยงาน" || meeting.department === department;
    const matchesPeriod = period === "ทั้งหมด" || meeting.date.startsWith(period);
    return matchesQuery && matchesType && matchesDepartment && matchesPeriod;
  }), [meetings, query, type, department, period]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reset = () => { setQuery(""); setType("ทั้งหมด"); setDepartment("ทุกหน่วยงาน"); setPeriod("ทั้งหมด"); setPage(1); };
  const update = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  const hasFilters = query || type !== "ทั้งหมด" || department !== "ทุกหน่วยงาน" || period !== "ทั้งหมด";

  return <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
    <div className="border-b border-[#e6eaf1] p-4 sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1 xl:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c98a9]" />
          <input value={query} onChange={(event) => update(setQuery, event.target.value)} placeholder="ค้นหาชื่อการประชุม สถานที่ หรือหน่วยงาน" className="h-10 w-full rounded-lg border border-[#dbe1eb] bg-white pl-10 pr-3 text-sm outline-none placeholder:text-[#9ba5b5] focus:border-[#8aaff0] focus:ring-3 focus:ring-[#e8effd]" />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="flex h-10 items-center gap-2 rounded-lg border border-[#dbe1eb] bg-[#f8fafc] px-3 text-xs font-semibold text-[#6c788c]"><Filter className="h-3.5 w-3.5" />ตัวกรอง</span>
          <select className={selectClass} value={type} onChange={(event) => update(setType, event.target.value)}><option>ทั้งหมด</option>{types.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={selectClass} value={period} onChange={(event) => update(setPeriod, event.target.value)}><option value="ทั้งหมด">ทุกช่วงเวลา</option>{periods.map((item) => <option key={item} value={item}>{formatMonth(item)}</option>)}</select>
          <select className={selectClass} value={department} onChange={(event) => update(setDepartment, event.target.value)}><option>ทุกหน่วยงาน</option>{departments.map((item) => <option key={item.id}>{item.name}</option>)}</select>
          {hasFilters && <button onClick={reset} className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#66748a] hover:bg-[#f1f4f8]"><X className="h-3.5 w-3.5" />ล้างตัวกรอง</button>}
        </div>
        <div className="flex rounded-lg border border-[#dbe1eb] bg-[#f8fafc] p-1">
          <button onClick={() => setMode("list")} className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold ${mode === "list" ? "bg-white text-[#245bb8] shadow-sm" : "text-[#66748a]"}`}><LayoutList className="h-3.5 w-3.5" />รายการ</button>
          <button onClick={() => setMode("calendar")} className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold ${mode === "calendar" ? "bg-white text-[#245bb8] shadow-sm" : "text-[#66748a]"}`}><CalendarDays className="h-3.5 w-3.5" />ปฏิทิน</button>
        </div>
      </div>
    </div>

    {mode === "list" ? <MeetingTable rows={rows} reset={reset} /> : <MeetingCalendar meetings={filtered} month={calendarMonth} onMonthChange={setCalendarMonth} />}
    {mode === "list" && <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}
  </div>;
}

function MeetingTable({ rows, reset }: { rows: MeetingListItem[]; reset: () => void }) {
  return <>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-left">
        <thead><tr className="border-b border-[#e7ebf1] bg-[#f9fafc] text-[11px] font-bold uppercase tracking-wide text-[#7d899b]"><th className="px-5 py-3.5">การประชุม</th><th className="px-4 py-3.5">วันที่และเวลา</th><th className="px-4 py-3.5">หน่วยงาน</th><th className="px-4 py-3.5">ผู้เข้าร่วม</th><th className="px-4 py-3.5">สถานะ</th><th className="w-12 px-4 py-3.5"><span className="sr-only">เปิด</span></th></tr></thead>
        <tbody className="divide-y divide-[#e9edf3]">{rows.map((meeting) => <tr key={meeting.id} className="group hover:bg-[#f8faff]"><td className="px-5 py-4"><Link href={`/meetings/${meeting.id}`} className="font-semibold text-[#29364d] group-hover:text-[#245bb8]">{meeting.title}</Link><p className="mt-1 text-[11px] text-[#8995a7]">{meeting.type}</p></td><td className="whitespace-nowrap px-4 py-4 text-sm text-[#536078]"><p>{formatDate(meeting.date)}</p><p className="mt-1 text-xs text-[#8a95a7]">{meeting.time}–{meeting.endTime} น.</p></td><td className="px-4 py-4 text-sm text-[#536078]"><p>{meeting.department}</p><MeetingPlace meeting={meeting} /></td><td className="px-4 py-4 text-sm text-[#536078]">{meeting.participantCount} คน</td><td className="px-4 py-4"><StatusBadge status={meeting.status} /></td><td className="px-4 py-4"><Link aria-label={`เปิด ${meeting.title}`} href={`/meetings/${meeting.id}`} className="grid h-8 w-8 place-items-center rounded-md text-[#8b96a8] hover:bg-[#eaf1ff] hover:text-[#2563eb]"><ChevronRight className="h-4 w-4" /></Link></td></tr>)}</tbody>
      </table>
    </div>
    <div className="divide-y divide-[#e8ecf2] md:hidden">{rows.map((meeting) => <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="block p-4 hover:bg-[#f8faff]"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold leading-5 text-[#29364d]">{meeting.title}</p><p className="mt-1 text-[11px] text-[#8995a7]">{meeting.type}</p></div><StatusBadge status={meeting.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#6f7c91]"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDate(meeting.date)}</span><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{meeting.participantCount} คน</span><span className="col-span-2"><MeetingPlace meeting={meeting} /></span></div></Link>)}</div>
    {!rows.length && <div className="grid min-h-64 place-items-center px-5 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf2fa] text-[#6580ab]"><Search className="h-5 w-5" /></span><p className="mt-3 font-semibold text-[#344159]">ไม่พบการประชุม</p><p className="mt-1 text-sm text-[#8490a2]">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p><button onClick={reset} className="mt-3 text-sm font-semibold text-[#2563eb]">ล้างตัวกรองทั้งหมด</button></div></div>}
  </>;
}

function MeetingCalendar({ meetings, month, onMonthChange }: { meetings: MeetingListItem[]; month: string; onMonthChange: (month: string) => void }) {
  const date = new Date(`${month}-01T00:00:00`);
  const start = new Date(date);
  start.setDate(1 - start.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
  const byDate = new Map<string, MeetingListItem[]>();
  meetings.forEach((meeting) => byDate.set(meeting.date, [...(byDate.get(meeting.date) ?? []), meeting]));

  const move = (offset: number) => {
    const next = new Date(`${month}-01T00:00:00`);
    next.setMonth(next.getMonth() + offset);
    onMonthChange(monthKey(next));
  };

  return <div className="p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between">
      <button onClick={() => move(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dbe1eb] text-[#65738a] hover:bg-[#f6f8fc]"><ChevronLeft className="h-4 w-4" /></button>
      <h2 className="text-sm font-bold text-[#26364f]">{formatMonth(month)}</h2>
      <button onClick={() => move(1)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dbe1eb] text-[#65738a] hover:bg-[#f6f8fc]"><ChevronRight className="h-4 w-4" /></button>
    </div>
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-[#e1e7f0]">
      {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((day) => <div key={day} className="border-b border-[#e1e7f0] bg-[#f8fafc] px-2 py-2 text-center text-[11px] font-bold text-[#748197]">{day}</div>)}
      {days.map((day) => {
        const key = monthKey(day, true);
        const items = byDate.get(key) ?? [];
        const muted = monthKey(day) !== month;
        return <div key={key} className={`min-h-28 border-b border-r border-[#edf1f6] p-2 ${muted ? "bg-[#fbfcfe] text-[#a4adbb]" : "bg-white"}`}>
          <p className="text-xs font-semibold">{day.getDate()}</p>
          <div className="mt-2 space-y-1">{items.slice(0, 3).map((meeting) => <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="block truncate rounded-md bg-[#edf3ff] px-2 py-1 text-[11px] font-semibold text-[#275caf] hover:bg-[#dfeaff]">{meeting.time} {meeting.title}</Link>)}{items.length > 3 && <p className="text-[11px] text-[#7d899b]">+{items.length - 3} รายการ</p>}</div>
        </div>;
      })}
    </div>
  </div>;
}

function MeetingPlace({ meeting }: { meeting: MeetingListItem }) {
  if (meeting.onlineUrl) return <a href={meeting.onlineUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex items-center gap-1 text-xs text-[#2563eb] hover:underline"><Link2 className="h-3 w-3" />{meeting.location || "เข้าร่วมออนไลน์"}<ExternalLink className="h-3 w-3" /></a>;
  return <span className="flex items-center gap-1 text-xs text-[#8a95a7]"><MapPin className="h-3 w-3" />{meeting.location || "ไม่ระบุสถานที่"}</span>;
}

export function NewMeetingAction() { return <Button asChild><Link href="/meetings/new"><Plus className="h-4 w-4" />สร้างการประชุม</Link></Button>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit" }).format(new Date(`${date}T00:00:00`)); }
function formatMonth(value: string) { return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(`${value}-01T00:00:00`)); }
function monthKey(value: Date, includeDate = false) {
  const month = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  return includeDate ? `${month}-${String(value.getDate()).padStart(2, "0")}` : month;
}
