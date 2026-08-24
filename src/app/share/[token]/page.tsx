import Link from "next/link";
import { CalendarDays, Clock3, Files, LockKeyhole, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_share_link", {
    p_token: token,
  });
  const meeting = data?.[0];
  if (error || !meeting) notFound();

  return (
    <main className="min-h-screen bg-[#f5f8fe] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#dfe6f2] bg-white shadow-[0_20px_60px_rgba(30,58,110,.08)]">
        <div className="border-b border-[#e8edf5] bg-[#102a56] px-6 py-7 text-white sm:px-10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#3b82f6]">
              <Files className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold">MeetFlow</p>
              <p className="text-xs text-blue-200">ลิงก์เอกสารการประชุม</p>
            </div>
          </div>
          <h1 className="mt-8 text-2xl font-bold sm:text-3xl">
            {meeting.title}
          </h1>
          <p className="mt-2 text-sm text-blue-100/80">
            ลิงก์นี้ใช้ได้ถึง {formatDateTime(meeting.expires_at)}
          </p>
        </div>
        <div className="grid gap-4 border-b border-[#e8edf5] px-6 py-6 sm:grid-cols-3 sm:px-10">
          <Info
            icon={CalendarDays}
            label="วันที่"
            value={formatDate(meeting.meeting_date)}
          />
          <Info
            icon={Clock3}
            label="เวลา"
            value={`${formatTime(meeting.start_time)}–${formatTime(meeting.end_time)} น.`}
          />
          <Info icon={MapPin} label="สถานที่" value={meeting.location} />
        </div>
        <article className="prose prose-slate max-w-none px-6 py-8 whitespace-pre-line sm:px-10">
          <h2>รายงานการประชุม</h2>
          {meeting.report_text ? (
            <p>{meeting.report_text}</p>
          ) : (
            <p className="text-slate-500">ยังไม่มีเนื้อหารายงานการประชุม</p>
          )}
        </article>
        <div className="flex items-center gap-2 border-t border-[#e8edf5] bg-[#fbfcfe] px-6 py-4 text-xs text-[#7a879c] sm:px-10">
          <LockKeyhole className="h-4 w-4" />
          ลิงก์นี้เป็นแบบอ่านอย่างเดียวและหมดอายุตามเวลาที่ระบุ
        </div>
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-xs text-[#8a96a9]">
        <Link
          href="/login"
          className="font-semibold text-[#2563eb] hover:underline"
        >
          เข้าสู่ MeetFlow
        </Link>{" "}
        เพื่อทำงานกับเอกสารและสิทธิ์ของคุณ
      </p>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-[#4e77c2]" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8d99ac]">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#34435d]">{value}</p>
      </div>
    </div>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(
    new Date(`${value}T00:00:00`),
  );
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "-";
}
