import Link from "next/link";
import { CalendarDays, ChevronRight, Clock3, FileCheck2, FilePenLine, Files, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardData, type MeetingListItem } from "@/lib/meetflow-data";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const upcoming = data.meetings.filter((meeting) => meeting.status === "scheduled").slice(0, 4);
  const monthKey = new Date().toISOString().slice(0, 7);
  const meetingsThisMonth = data.meetings.filter((meeting) => meeting.date.startsWith(monthKey)).length;
  const pendingReports = data.reports.filter((report) => report.status === "draft" || report.status === "in_review").length;
  const publishedReports = data.reports.filter((report) => report.status === "published").length;
  const reportStats = [
    { label: "ฉบับร่าง", value: data.reports.filter((report) => report.status === "draft").length, color: "bg-amber-400" },
    { label: "รอตรวจทาน", value: data.reports.filter((report) => report.status === "in_review").length, color: "bg-violet-500" },
    { label: "เผยแพร่แล้ว", value: publishedReports, color: "bg-blue-500" },
  ];
  const documentStats = Array.from(data.documents.reduce((map, document) => map.set(document.category, (map.get(document.category) ?? 0) + 1), new Map<string, number>())).slice(0, 5);

  return <>
    <PageHeader eyebrow={formatToday()} title="ภาพรวมงาน" description="ติดตามการประชุม รายงาน และเอกสารที่ต้องดำเนินการ" />

    <section className="mb-6 grid overflow-hidden rounded-xl border border-[#dfe5ef] bg-white sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={CalendarDays} label="การประชุมเดือนนี้" value={String(meetingsThisMonth)} note={`กำลังจะมาถึง ${upcoming.length} ครั้ง`} />
      <Metric icon={FilePenLine} label="รายงานรอดำเนินการ" value={String(pendingReports)} note="ฉบับร่างและรอตรวจทาน" alert />
      <Metric icon={FileCheck2} label="เผยแพร่แล้ว" value={String(publishedReports)} note="รายงานที่ผ่านขั้นตอนแล้ว" />
      <Metric icon={Files} label="เอกสารในระบบ" value={String(data.documents.length)} note="ไฟล์จริงจาก Supabase Storage" last />
    </section>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.85fr)]">
      <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
        <CardHeader title="กำหนดการประชุม" description="การประชุมที่กำลังจะมาถึง" href="/meetings" />
        <div className="divide-y divide-[#e9edf3]">{upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}{!upcoming.length && <EmptyRow text="ยังไม่มีการประชุมที่กำลังจะมาถึง" />}</div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
        <div className="border-b border-[#e7ebf1] px-5 py-5"><h2 className="font-bold text-[#243149]">งานที่ต้องจัดการ</h2><p className="mt-1 text-xs text-[#8490a3]">เรียงจากสถานะที่ต้องทำต่อ</p></div>
        <div className="space-y-1 p-2">
          <WorkItem tone="amber" title={`รายงานฉบับร่าง ${reportStats[0].value} รายการ`} meta="เปิดหน้า รายงานการประชุม" href="/reports" />
          <WorkItem tone="blue" title={`รอตรวจทาน ${reportStats[1].value} รายการ`} meta="ตรวจทานก่อนเผยแพร่" href="/reports" />
          <WorkItem tone="slate" title={`เอกสาร ${data.documents.length} ไฟล์`} meta="ตรวจสิทธิ์และดาวน์โหลด" href="/documents" />
          {data.context?.role === "admin" && <WorkItem tone="blue" title={`สมาชิก ${data.members.length} คน`} meta="จัดการ RBAC ขององค์กร" href="/members" />}
        </div>
      </div>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
        <CardHeader title="สถานะรายงาน" description="ข้อมูลจากตาราง reports" href="/reports" />
        <div className="px-6 py-5"><BarChart rows={reportStats} total={Math.max(1, data.reports.length)} /></div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
        <CardHeader title="เอกสารตามหมวดหมู่" description="ข้อมูลจากตาราง attachments" href="/documents" />
        <div className="px-6 py-5"><BarChart rows={documentStats.map(([label, value], index) => ({ label, value, color: ["bg-blue-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-400", "bg-slate-400"][index] }))} total={Math.max(1, data.documents.length)} /></div>
      </div>
    </section>
  </>;
}

function Metric({ icon: Icon, label, value, note, alert, last }: { icon: typeof CalendarDays; label: string; value: string; note: string; alert?: boolean; last?: boolean }) {
  return <div className={`flex gap-4 p-5 ${last ? "" : "border-b border-[#e7ebf1] sm:border-b-0 sm:border-r"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#edf3ff] text-[#2b61bd]"><Icon className="h-[19px] w-[19px]" /></span><div><p className="text-xs font-medium text-[#748197]">{label}</p><p className="mt-1 text-2xl font-bold text-[#1c2a43]">{value}</p><p className={`mt-1 text-[11px] ${alert ? "font-semibold text-[#d15d3e]" : "text-[#919bad]"}`}>{note}</p></div></div>;
}

function CardHeader({ title, description, href }: { title: string; description: string; href: string }) {
  return <div className="flex items-center justify-between border-b border-[#e7ebf1] px-5 py-4 sm:px-6"><div><h2 className="font-bold text-[#243149]">{title}</h2><p className="mt-0.5 text-xs text-[#8793a6]">{description}</p></div><Link href={href} className="text-xs font-semibold text-[#2563eb] hover:underline">ดูทั้งหมด</Link></div>;
}

function MeetingRow({ meeting }: { meeting: MeetingListItem }) {
  return <Link href={`/meetings/${meeting.id}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-[#f8faff] sm:px-6"><DateBox date={meeting.date} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-[#25334b] group-hover:text-[#245bb8]">{meeting.title}</p><StatusBadge status={meeting.status} /></div><div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7d899d]"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{meeting.time}–{meeting.endTime} น.</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{meeting.location}</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{meeting.participantCount} คน</span></div></div><ChevronRight className="h-4 w-4 text-[#a1aaba] group-hover:text-[#2563eb]" /></Link>;
}

function DateBox({ date }: { date: string }) {
  const parsed = new Date(`${date}T00:00:00`);
  return <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[#d9e3f3] bg-[#f7faff] text-center"><span><span className="block text-[9px] font-bold uppercase text-[#71829d]">{new Intl.DateTimeFormat("th-TH", { month: "short" }).format(parsed)}</span><span className="block text-lg font-bold leading-4 text-[#214f9e]">{parsed.getDate()}</span></span></span>;
}

function WorkItem({ tone, title, meta, href }: { tone: "amber" | "blue" | "slate"; title: string; meta: string; href: string }) {
  const colors = { amber: "bg-amber-400", blue: "bg-blue-500", slate: "bg-slate-400" };
  return <Link href={href} className="group flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-[#f6f8fc]"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors[tone]}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#2c394f] group-hover:text-[#245bb8]">{title}</span><span className="mt-1 block text-xs text-[#8994a6]">{meta}</span></span><ChevronRight className="mt-1 h-4 w-4 text-[#a3acbb]" /></Link>;
}

function BarChart({ rows, total }: { rows: Array<{ label: string; value: number; color: string }>; total: number }) {
  if (!rows.length) return <p className="text-sm text-[#7d899b]">ยังไม่มีข้อมูล</p>;
  return <div className="space-y-4">{rows.map((row) => <div key={row.label} className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)_40px] sm:items-center"><p className="truncate text-sm font-semibold text-[#344159]">{row.label}</p><div className="h-2.5 overflow-hidden rounded-full bg-[#e8ecf2]"><div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max(4, Math.round((row.value / total) * 100))}%` }} /></div><p className="text-right text-sm font-bold text-[#26344b]">{row.value}</p></div>)}</div>;
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-6 py-10 text-center text-sm text-[#7d899b]">{text}</div>;
}

function formatToday() {
  return new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
}
