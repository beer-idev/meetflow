"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { updateMeetingWorkflowStatusAction } from "@/app/actions/meetings";
import type { MeetingStatus } from "@/features/meetings/types";

const statuses: Array<{ value: MeetingStatus; label: string; description: string }> = [
  { value: "scheduled", label: "กำลังจะมาถึง", description: "สร้างกำหนดการแล้ว แต่ยังไม่เริ่มประชุม" },
  { value: "in_progress", label: "กำลังประชุม", description: "การประชุมกำลังดำเนินอยู่" },
  { value: "minutes", label: "จัดทำรายงาน", description: "ประชุมเสร็จแล้ว อยู่ระหว่างเขียนรายงานและบันทึกมติ" },
  { value: "review", label: "รอตรวจทาน", description: "เขียนรายงานแล้วและส่งให้ผู้เกี่ยวข้องตรวจสอบ" },
  { value: "published", label: "เผยแพร่แล้ว", description: "รายงานฉบับสมบูรณ์ สามารถแชร์และพิมพ์ได้" },
  { value: "cancelled", label: "ยกเลิก", description: "ยกเลิกการประชุมรายการนี้" },
];

export function MeetingWorkflowControl({ meetingId, value, notify }: { meetingId: string; value: MeetingStatus; notify: (message: string) => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState<MeetingStatus>(value);
  const [isPending, startTransition] = useTransition();
  const current = statuses.find((item) => item.value === selected) ?? statuses[0];

  const change = (next: MeetingStatus) => {
    setSelected(next);
    startTransition(async () => {
      const result = await updateMeetingWorkflowStatusAction(meetingId, next);
      if (!result.ok) {
        setSelected(value);
        return notify(result.error);
      }
      notify(`เปลี่ยนสถานะเป็น “${statuses.find((item) => item.value === next)?.label}” แล้ว`);
      router.refresh();
    });
  };

  return <div className="rounded-xl border border-[#dfe5ef] bg-white p-5"><div className="flex items-center justify-between gap-4"><div><h3 className="font-bold text-[#29364c]">สถานะการประชุม</h3><p className="mt-1 text-xs leading-5 text-[#7e8a9d]">ใช้สถานะเพื่อติดตามงานตั้งแต่กำหนดประชุมจนถึงเผยแพร่รายงาน</p></div><div className="relative"><select aria-label="เปลี่ยนสถานะการประชุม" value={selected} disabled={isPending} onChange={(event) => change(event.target.value as MeetingStatus)} className="h-10 appearance-none rounded-lg border border-[#d7dfeb] bg-white py-0 pl-3 pr-9 text-sm font-semibold text-[#3b4a63] outline-none focus:border-[#7da4e8] disabled:opacity-60">{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d899b]" /></div></div><div className="mt-4 rounded-lg bg-[#f4f7fb] px-4 py-3"><p className="text-xs font-semibold text-[#41618f]">{isPending ? "กำลังเปลี่ยนสถานะ..." : current.label}</p><p className="mt-1 text-xs leading-5 text-[#748197]">{current.description}</p></div></div>;
}
