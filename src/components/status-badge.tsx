import type { MeetingStatus } from "@/features/meetings/types";
import { cn } from "@/lib/utils";

const statusMap: Record<MeetingStatus, [string, string]> = {
  scheduled: ["กำลังจะมาถึง", "bg-[#eaf1ff] text-[#245bb8]"],
  in_progress: ["กำลังประชุม", "bg-[#e8f7f1] text-[#23725c]"],
  minutes: ["จัดทำรายงาน", "bg-[#fff5df] text-[#92661d]"],
  review: ["รอตรวจทาน", "bg-[#f3edff] text-[#7042ae]"],
  published: ["เผยแพร่แล้ว", "bg-[#edf1f5] text-[#58677d]"],
  cancelled: ["ยกเลิก", "bg-[#fff0eb] text-[#b84a24]"],
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold", statusMap[status][1])}>{statusMap[status][0]}</span>;
}
