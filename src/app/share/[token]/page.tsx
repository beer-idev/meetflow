import Link from "next/link";
import { Download, Files, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";
import { SharedReportContent } from "@/features/reports/shared-report-content";
import { formatSharedDateTime } from "@/lib/shared-report";
import { getSharedReport } from "@/lib/shared-report-server";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const meeting = await getSharedReport(token);
  if (!meeting) notFound();

  return (
    <main className="min-h-screen bg-[#f3f6fb] px-4 py-7 sm:px-8 sm:py-10">
      <div className="mx-auto mb-5 flex max-w-[900px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563eb] text-white shadow-sm"><Files className="h-5 w-5" /></span>
          <div><p className="font-bold text-[#17243c]">MeetFlow</p><p className="text-xs text-[#7b879a]">รายงานการประชุมฉบับเผยแพร่</p></div>
        </div>
        <Link href={`/share/${encodeURIComponent(token)}/print`} target="_blank" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]">
          <Download className="h-4 w-4" />พิมพ์ / บันทึกเป็น PDF
        </Link>
      </div>

      <SharedReportContent report={meeting} />

      <div className="mx-auto mt-5 flex max-w-[900px] flex-col gap-2 text-center text-xs text-[#7a879c] sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span className="inline-flex items-center justify-center gap-2 sm:justify-start"><LockKeyhole className="h-4 w-4" />อ่านอย่างเดียว · ลิงก์หมดอายุ {formatSharedDateTime(meeting.expires_at)}</span>
        <Link href="/login" className="font-semibold text-[#2563eb] hover:underline">เข้าสู่ระบบ MeetFlow</Link>
      </div>
    </main>
  );
}
