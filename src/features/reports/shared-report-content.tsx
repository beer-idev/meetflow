import { CalendarDays, Clock3, Link2, MapPin, Users } from "lucide-react";
import type { SharedReport } from "@/lib/shared-report";
import { formatSharedDate, formatSharedTime } from "@/lib/shared-report";

export function SharedReportContent({ report, printable = false }: { report: SharedReport; printable?: boolean }) {
  return (
    <article className={`mx-auto max-w-[900px] overflow-hidden bg-white text-[#202938] ${printable ? "print-document" : "rounded-2xl border border-[#dfe6f2] shadow-[0_20px_60px_rgba(30,58,110,.08)]"}`}>
      <header className="border-b-2 border-[#274d87] px-6 py-8 text-center sm:px-12">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#5474a5]">{report.meeting_type}</p>
        <h1 className="mt-3 text-2xl font-bold leading-9 text-[#17243c] sm:text-3xl">{report.title}</h1>
        {report.description && <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#647188]">{report.description}</p>}
      </header>

      <section className="grid gap-4 border-b border-[#e7ecf3] bg-[#f8faff] px-6 py-5 sm:grid-cols-2 sm:px-12 lg:grid-cols-4">
        <Meta icon={CalendarDays} label="วันที่ประชุม" value={formatSharedDate(report.meeting_date)} />
        <Meta icon={Clock3} label="เวลา" value={`${formatSharedTime(report.start_time)}–${formatSharedTime(report.end_time)} น.`} />
        <Meta icon={MapPin} label="สถานที่" value={report.location || "-"} />
        <Meta icon={Users} label="ผู้เข้าร่วม" value={`${report.participants.length} คน`} />
        {report.online_url && <div className="sm:col-span-2 lg:col-span-4 print:hidden"><a href={report.online_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] hover:underline"><Link2 className="h-4 w-4" />เปิดลิงก์การประชุมออนไลน์</a></div>}
      </section>

      <div className="space-y-10 px-6 py-8 sm:px-12 sm:py-10">
        <section>
          <Heading number="1" title="ผู้เข้าร่วมประชุม" />
          {report.participants.length ? <ol className="mt-4 grid gap-x-8 gap-y-2 text-sm leading-6 text-[#46546b] sm:grid-cols-2">{report.participants.map((person, index) => <li key={`${person.name}-${index}`}>{index + 1}. {person.name}</li>)}</ol> : <p className="mt-4 text-sm text-[#7c8798]">ไม่ได้ระบุรายชื่อผู้เข้าร่วม</p>}
        </section>

        <section>
          <Heading number="2" title="รายงานการประชุม" />
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-[#3e4b60]">{report.report_text || "ยังไม่มีเนื้อหารายงานการประชุม"}</div>
        </section>

        <section>
          <Heading number="3" title="ระเบียบวาระและมติที่ประชุม" />
          <div className="mt-5 space-y-6">
            {report.agenda.map((item) => <div key={item.position} className="break-inside-avoid border-l-2 border-[#b8c9e5] pl-4"><h3 className="font-bold leading-6 text-[#28364e]">ระเบียบวาระที่ {item.position} {item.title}</h3>{item.detail && <p className="mt-2 text-sm leading-7 text-[#536176]">{item.detail}</p>}<p className="mt-3 rounded-lg bg-[#eef8f3] px-4 py-3 text-sm leading-6 text-[#315f50] print:border print:border-[#b9d2c7] print:bg-white"><b>มติที่ประชุม:</b> {item.resolution || "รอบันทึกมติ"}</p></div>)}
            {!report.agenda.length && <p className="text-sm text-[#7c8798]">ไม่ได้ระบุระเบียบวาระ</p>}
          </div>
        </section>

        <section className="grid gap-14 pt-8 text-center text-sm sm:grid-cols-2"><Signature name={report.prepared_by} title="ผู้จัดทำรายงานการประชุม" /><Signature name="................................................" title="ผู้ตรวจรายงานการประชุม" /></section>
      </div>
    </article>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#4e77c2]" /><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#8d99ac]">{label}</p><p className="mt-1 text-sm font-semibold leading-5 text-[#34435d]">{value}</p></div></div>;
}

function Heading({ number, title }: { number: string; title: string }) {
  return <div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2563eb] text-xs font-bold text-white print:border print:border-[#333] print:bg-white print:text-black">{number}</span><h2 className="text-lg font-bold text-[#24334c]">{title}</h2></div>;
}

function Signature({ name, title }: { name: string; title: string }) {
  return <div className="break-inside-avoid"><div className="h-14" /><div className="mx-auto max-w-[260px] border-t border-[#8b93a0] pt-2"><p>({name})</p><p className="mt-1 text-xs text-[#68758a]">{title}</p></div></div>;
}

