"use client";

import { ArrowLeft, Download } from "lucide-react";
import { OfficialMeetingReport } from "@/features/reports/official-meeting-report";
import type { SharedReport } from "@/lib/shared-report";

export function SharedReportPrint({ report }: { report: SharedReport }) {
  return <main className="min-h-screen bg-[#eef2f7] py-6 print:bg-white print:py-0"><div className="mx-auto mb-4 flex max-w-[900px] items-center justify-between px-4 print:hidden"><button onClick={() => window.close()} className="flex items-center gap-1.5 text-sm font-semibold text-[#59677d]"><ArrowLeft className="h-4 w-4" />กลับ</button><button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white hover:bg-[#1d4ed8]"><Download className="h-4 w-4" />พิมพ์ / บันทึกเป็น PDF</button></div><OfficialMeetingReport data={{ title: report.title, meetingType: report.meeting_type, date: report.meeting_date, startTime: report.start_time.slice(0, 5), endTime: report.end_time?.slice(0, 5) ?? "-", location: report.location, description: report.description, reportText: report.report_text, people: report.participants.map((person) => ({ name: person.name, role: roleLabel(person.role), absent: person.attendance_status === "absent" || person.attendance_status === "declined" })), agenda: report.agenda, preparedBy: report.prepared_by }} /></main>;
}

function roleLabel(role?: string) {
  return ({ admin: "ผู้ดูแลระบบ", chair: "ประธานการประชุม", reporter: "ผู้จดรายงานการประชุม", reviewer: "ผู้ตรวจทาน", participant: "ผู้เข้าร่วมประชุม" } as Record<string, string>)[role ?? ""] ?? "ผู้เข้าร่วมประชุม";
}
