"use client";

import { ArrowLeft, Download, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MeetingDetailView } from "@/lib/meetflow-data";

export function PrintReport({ detail }: { detail: MeetingDetailView }) {
  return <div className="min-h-screen bg-[#eef2f7] py-6 print:bg-white print:py-0">
    <div className="mx-auto mb-4 flex max-w-[900px] items-center justify-between px-4 print:hidden">
      <button onClick={() => window.close()} className="flex items-center gap-1.5 text-sm font-semibold text-[#59677d]"><ArrowLeft className="h-4 w-4" />กลับ</button>
      <Button onClick={() => window.print()}><Download className="h-4 w-4" />พิมพ์ / บันทึกเป็น PDF</Button>
    </div>
    <article className="mx-auto min-h-[1123px] max-w-[794px] bg-white px-16 py-14 text-[#202938] shadow-sm print:min-h-0 print:max-w-none print:px-0 print:py-0 print:shadow-none">
      <header className="border-b-2 border-[#263b60] pb-6 text-center">
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-lg bg-[#2563eb] text-white print:border print:border-[#444] print:bg-white print:text-black"><Files className="h-5 w-5" /></div>
        <p className="text-xs font-semibold tracking-wide text-[#69758a]">{detail.type}</p>
        <h1 className="mt-2 text-xl font-bold">{detail.title}</h1>
      </header>
      <section className="mt-6 grid grid-cols-[130px_1fr] gap-x-5 gap-y-2 text-sm">
        <b>วันที่ประชุม</b><p>{formatDate(detail.date)}</p>
        <b>เวลา</b><p>{detail.time}–{detail.endTime} น.</p>
        <b>สถานที่</b><p>{detail.location}</p>
        <b>ผู้เข้าร่วม</b><p>{detail.participants.length} คน</p>
      </section>
      <section className="mt-8 space-y-7 text-sm leading-7">
        {detail.agenda.map((item) => <ReportSection key={item.id} title={`ระเบียบวาระที่ ${item.position} ${item.title}`}>
          {item.detail && <p>{item.detail}</p>}
          <Resolution>{item.resolution ?? "รอบันทึกมติ"}</Resolution>
        </ReportSection>)}
        {!detail.agenda.length && detail.report?.plainText && <p className="whitespace-pre-line">{detail.report.plainText}</p>}
      </section>
      <footer className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
        <Signature name={detail.report?.preparedBy ?? detail.owner} title="ผู้จดรายงานการประชุม" />
        <Signature name="................................" title="ผู้ตรวจรายงานการประชุม" />
      </footer>
    </article>
  </div>;
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="font-bold">{title}</h2><div className="mt-2 pl-5">{children}</div></div>;
}

function Resolution({ children }: { children: React.ReactNode }) {
  return <p className="mt-2"><b>มติที่ประชุม:</b> {children}</p>;
}

function Signature({ name, title }: { name: string; title: string }) {
  return <div><div className="h-16" /><div className="border-t border-[#8b93a0] pt-2">({name})<br />{title}</div></div>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}
