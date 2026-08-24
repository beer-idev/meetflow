import Link from "next/link";
import { MeetingDetail } from "@/features/meetings/meeting-detail";
import { Button } from "@/components/ui/button";
import { getMeetingDetail } from "@/lib/meetflow-data";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMeetingDetail(id);

  if (!data.detail) {
    return <div className="rounded-xl border border-[#dfe5ef] bg-white px-6 py-10 text-center">
      <h1 className="text-lg font-bold text-[#26344b]">ไม่พบการประชุม</h1>
      <p className="mt-2 text-sm text-[#7d899b]">รายการนี้อาจถูกลบ หรือคุณไม่มีสิทธิ์เข้าถึง</p>
      <Button asChild className="mt-5"><Link href="/meetings">กลับไปรายการประชุม</Link></Button>
    </div>;
  }

  return <MeetingDetail detail={data.detail} members={data.members} role={data.context?.role ?? "participant"} />;
}
