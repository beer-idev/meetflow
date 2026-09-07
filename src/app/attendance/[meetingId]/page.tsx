import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { AttendanceForm } from "@/features/meetings/attendance-form";
import { getPublicAttendanceMeeting } from "@/lib/attendance";

export default async function AttendancePage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const meeting = await getPublicAttendanceMeeting(meetingId);

  if (!meeting) return <main className="grid min-h-screen place-items-center bg-[#f3f6fb] px-4"><div className="max-w-md rounded-2xl border border-[#dfe5ef] bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-[#26344b]">ไม่พบแบบลงชื่อเข้าร่วม</h1><p className="mt-2 text-sm leading-6 text-[#7d899b]">ลิงก์อาจไม่ถูกต้อง หรือการประชุมนี้ถูกยกเลิกแล้ว</p></div></main>;

  return <main className="min-h-screen bg-[#f3f6fb] px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-xl">
      <div className="mb-5 text-center"><p className="text-sm font-bold text-[#315fae]">MeetFlow</p><p className="mt-1 text-xs text-[#8995a8]">{meeting.organizationName}</p></div>
      <section className="overflow-hidden rounded-2xl border border-[#dce3ee] bg-white shadow-[0_16px_45px_rgba(37,62,101,.10)]">
        <div className="border-b border-[#e7ebf2] bg-[#f8faff] px-6 py-5 text-center"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#6f84aa]">ลงชื่อเข้าร่วมประชุม</p><h1 className="mt-2 text-xl font-bold leading-8 text-[#23314a]">{meeting.title}</h1></div>
        <div className="grid gap-3 border-b border-[#e7ebf2] px-6 py-4 text-sm text-[#5f6d84] sm:grid-cols-2"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#5277b3]" />{formatDate(meeting.meetingDate)}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#5277b3]" />{meeting.startTime.slice(0, 5)}–{meeting.endTime?.slice(0, 5) ?? "-"} น.</p><p className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-[#5277b3]" />{meeting.location || (meeting.meetingMode === "online" ? "ประชุมออนไลน์" : "ไม่ระบุสถานที่")}</p></div>
        <div className="px-6 py-6"><AttendanceForm meetingId={meeting.id} /></div>
      </section>
    </div>
  </main>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

