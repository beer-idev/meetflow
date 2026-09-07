"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, UserRoundCheck } from "lucide-react";
import { registerMeetingAttendanceAction } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";

const field = "h-11 w-full rounded-lg border border-[#d8dfeb] bg-white px-3.5 text-sm text-[#29364d] outline-none placeholder:text-[#9ba5b5] focus:border-[#84aaf0] focus:ring-3 focus:ring-[#e7efff]";

export function AttendanceForm({ meetingId }: { meetingId: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return <form onSubmit={(event) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await registerMeetingAttendanceAction({
        meetingId,
        fullName: form.get("fullName"),
        positionTitle: form.get("positionTitle"),
        department: form.get("department"),
        website: form.get("website"),
      });
      if (!result.ok) return setError(result.error);
      window.location.assign(result.data.url);
    });
  }} className="space-y-4">
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[#354158]">ชื่อ–นามสกุล <b className="text-red-500">*</b></span><input name="fullName" required minLength={2} maxLength={160} autoComplete="name" className={field} placeholder="เช่น สมชาย ใจดี" /></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[#354158]">ตำแหน่ง <b className="text-red-500">*</b></span><input name="positionTitle" required minLength={2} maxLength={160} className={field} placeholder="เช่น หัวหน้าฝ่ายแผนงาน" /></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[#354158]">หน่วยงาน</span><input name="department" maxLength={200} autoComplete="organization" className={field} placeholder="เช่น กองแผนงาน" /></label>
    <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
    {error && <p className="rounded-lg bg-[#fff0eb] px-3 py-2.5 text-sm font-semibold text-[#b84a24]">{error}</p>}
    <Button type="submit" className="w-full" disabled={isPending}>{isPending ? <><LoaderCircle className="h-4 w-4 animate-spin" />กำลังเปิดรายงาน...</> : <><UserRoundCheck className="h-4 w-4" />ยืนยันการเข้าร่วมประชุม</>}</Button>
    <p className="text-center text-xs leading-5 text-[#8a95a6]">ข้อมูลนี้ใช้สำหรับจัดทำรายชื่อผู้เข้าร่วมและรายงานการประชุมเท่านั้น</p>
  </form>;
}
