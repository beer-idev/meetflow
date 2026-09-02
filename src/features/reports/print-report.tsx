"use client";

import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfficialMeetingReport } from "@/features/reports/official-meeting-report";
import type { MeetingDetailView } from "@/lib/meetflow-data";

export function PrintReport({ detail }: { detail: MeetingDetailView }) {
  return <div className="min-h-screen bg-[#eef2f7] py-6 print:min-h-0 print:bg-white print:py-0">
    <div className="mx-auto mb-4 flex max-w-[900px] items-center justify-between px-4 print:hidden">
      <button onClick={() => window.close()} className="flex items-center gap-1.5 text-sm font-semibold text-[#59677d]"><ArrowLeft className="h-4 w-4" />กลับ</button>
      <Button onClick={() => window.print()}><Download className="h-4 w-4" />พิมพ์ / บันทึกเป็น PDF</Button>
    </div>
    <OfficialMeetingReport data={{
      title: detail.title,
      meetingType: detail.type,
      date: detail.date,
      startTime: detail.time,
      endTime: detail.endTime,
      location: detail.location,
      description: detail.description,
      reportText: detail.report?.plainText,
      people: detail.participants.map((person) => ({
        name: person.name,
        role: person.meetingRole === "chair" ? "ประธานการประชุม" : person.meetingRole === "reporter" ? "ผู้จดรายงานการประชุม" : person.department,
        absent: person.attendanceStatus === "absent" || person.attendanceStatus === "declined",
      })),
      agenda: detail.agenda,
      preparedBy: detail.report?.preparedBy ?? detail.owner,
    }} />
  </div>;
}
