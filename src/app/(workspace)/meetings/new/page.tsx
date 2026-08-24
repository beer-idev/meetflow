import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { MeetingCreateForm } from "@/features/meetings/meeting-create-form";
import { getWorkspaceData } from "@/lib/meetflow-data";

export default async function NewMeetingPage() {
  const data = await getWorkspaceData();
  if (!data.context || !["admin", "chair", "reporter"].includes(data.context.role)) return <AccessDenied description="เฉพาะผู้ดูแล ประธาน หรือผู้จัดทำรายงานที่สร้างการประชุมได้" />;

  return <>
    <PageHeader eyebrow="การประชุม / สร้างใหม่" title="สร้างการประชุม" description="กรอกข้อมูล ผู้เข้าร่วม และระเบียบวาระสำหรับการประชุม" />
    <MeetingCreateForm departments={data.departments} members={data.members} />
  </>;
}
