"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export type OfficialAgendaItem = {
  position: number;
  title: string;
  detail: string | null;
  resolution: string | null;
};

export type OfficialPerson = {
  name: string;
  role?: string;
  absent?: boolean;
};

export type OfficialMeetingReportData = {
  title: string;
  meetingType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string | null;
  reportText?: string | null;
  people: OfficialPerson[];
  agenda: OfficialAgendaItem[];
  preparedBy: string;
  reviewedBy?: string;
};

export function OfficialMeetingReport({ data }: { data: OfficialMeetingReportData }) {
  const pageRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const attendees = data.people.filter((person) => !person.absent);
  const absentees = data.people.filter((person) => person.absent);
  const contentWeight = data.people.reduce((total, person) => total + person.name.length + (person.role?.length ?? 0) + 70, 0)
    + data.agenda.reduce((total, item) => total + item.title.length + (item.detail?.length ?? 0) + (item.resolution?.length ?? 0) + 130, 0)
    + (data.agenda.length ? 0 : data.reportText?.length ?? 0);
  const density = contentWeight > 4300 ? "ultra" : contentWeight > 3000 ? "dense" : contentWeight > 1900 ? "compact" : "normal";

  const fitToOnePage = useCallback(() => {
    const page = pageRef.current;
    const content = contentRef.current;
    if (!page || !content || !page.clientWidth) return;

    content.style.zoom = "1";
    content.style.width = "100%";
    const availableHeight = page.clientWidth * (282 / 192);
    const naturalHeight = content.scrollHeight;
    const scale = naturalHeight > availableHeight ? availableHeight / naturalHeight : 1;
    content.style.width = `${100 / scale}%`;
    content.style.zoom = String(scale);
  }, []);

  useLayoutEffect(() => {
    fitToOnePage();
    const frame = requestAnimationFrame(fitToOnePage);
    return () => cancelAnimationFrame(frame);
  }, [fitToOnePage, data]);

  useEffect(() => {
    window.addEventListener("beforeprint", fitToOnePage);
    window.addEventListener("afterprint", fitToOnePage);
    return () => {
      window.removeEventListener("beforeprint", fitToOnePage);
      window.removeEventListener("afterprint", fitToOnePage);
    };
  }, [fitToOnePage]);

  return <article ref={pageRef} data-density={density} className="official-report mx-auto min-h-[1123px] max-w-[794px] overflow-hidden bg-white text-[#25211f] shadow-sm print:min-h-0 print:max-w-none print:shadow-none">
    <div ref={contentRef} className="report-fit-content">
    <header className="report-header border-b-2 border-[#55473c] px-10 py-5 text-center sm:px-14">
      <h1 className="text-2xl font-bold leading-tight tracking-normal text-[#25211f]">รายงานการประชุม</h1>
    </header>

    <div className="report-body px-8 py-8 sm:px-14 sm:py-10">
      <section className="text-center">
        <h2 className="text-lg font-bold leading-8">{data.title}</h2>
        <p className="mt-1 text-sm">{formatFormalDate(data.date)}</p>
        <p className="mt-1 text-sm">เวลา {data.startTime}–{data.endTime} น.</p>
        <p className="mt-1 text-sm">ณ {data.location || "ไม่ระบุสถานที่"}</p>
        <div className="mx-auto mt-4 h-px max-w-[560px] bg-[#544a43]" />
      </section>

      <section className="report-people mt-7 space-y-5 text-sm leading-7">
        <PeopleSection title="ผู้มาประชุม" people={attendees} empty="ไม่ระบุรายชื่อ" />
        <PeopleSection title="ผู้ไม่มาประชุม (ถ้ามี)" people={absentees} empty="ไม่มี" />
        <div className="grid grid-cols-[150px_1fr] gap-3"><h3 className="font-bold">ผู้เข้าร่วมประชุม (ถ้ามี)</h3><p>{attendees.length ? `${attendees.length} คน ตามรายชื่อข้างต้น` : "ไม่มี"}</p></div>
        <div className="grid grid-cols-[150px_1fr] gap-3"><h3 className="font-bold">เริ่มประชุมเวลา</h3><p>{data.startTime} น.</p></div>
      </section>

      <section className="report-intro mt-7 text-sm leading-7">
        <p className="indent-10">{data.description || "ประธานกล่าวเปิดประชุม และดำเนินการประชุมตามระเบียบวาระดังต่อไปนี้"}</p>
      </section>

      {data.reportText && !data.agenda.length && <section className="report-summary mt-7 break-inside-avoid text-sm leading-7"><h3 className="font-bold">สาระสำคัญโดยสรุป</h3><p className="mt-2 whitespace-pre-line indent-10">{data.reportText}</p></section>}

      <section className="report-agenda mt-8 space-y-8 text-sm leading-7">
        {data.agenda.map((item) => <div key={item.position} className="break-inside-avoid"><div className="grid grid-cols-[150px_1fr] gap-3"><h3 className="font-bold">ระเบียบวาระที่ {item.position}</h3><h3 className="font-bold">{item.title}</h3></div><div className="mt-2 pl-[162px]"><p>{item.detail || "ไม่มีรายละเอียดเพิ่มเติม"}</p><p className="mt-2"><b>มติที่ประชุม</b> {item.resolution || "รอบันทึกมติที่ประชุม"}</p></div></div>)}
        {!data.agenda.length && <div className="grid grid-cols-[150px_1fr] gap-3"><h3 className="font-bold">ระเบียบวาระ</h3><p>ไม่มีข้อมูลระเบียบวาระ</p></div>}
      </section>

      <section className="report-ending mt-10 grid grid-cols-[150px_1fr] gap-3 text-sm"><h3 className="font-bold">เลิกประชุมเวลา</h3><p>{data.endTime} น.</p></section>

      <section className="report-signatures mt-16 grid gap-16 text-center text-sm sm:grid-cols-2">
        <Signature name={data.preparedBy} title="ผู้จดรายงานการประชุม" />
        <Signature name={data.reviewedBy || "................................................"} title="ผู้ตรวจรายงานการประชุม" />
      </section>

      <footer className="report-footer mt-16 border-t border-[#a79d94] pt-4 text-center text-[10px] leading-5 text-[#716860]">เอกสารฉบับนี้จัดทำและจัดเก็บโดยระบบ MeetFlow · ระบบจัดการการประชุมและรายงานดิจิทัล</footer>
    </div>
    </div>
  </article>;
}

function PeopleSection({ title, people, empty }: { title: string; people: OfficialPerson[]; empty: string }) {
  return <div className="grid grid-cols-[150px_1fr] gap-3"><h3 className="font-bold">{title}</h3><div>{people.length ? <ol>{people.map((person, index) => <li key={`${person.name}-${index}`} className="grid grid-cols-[24px_minmax(0,1fr)]"><span>{index + 1}.</span><span>{person.name}{person.role ? <span className="ml-2 text-[#655d57]">{person.role}</span> : null}</span></li>)}</ol> : <p>{empty}</p>}</div></div>;
}

function Signature({ name, title }: { name: string; title: string }) {
  return <div className="break-inside-avoid"><p>ลงชื่อ ........................................................</p><p className="mt-2">({name})</p><p className="mt-1">{title}</p></div>;
}

function formatFormalDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}
