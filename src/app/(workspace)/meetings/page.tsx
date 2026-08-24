import { PageHeader } from "@/components/page-header";
import { MeetingsList, NewMeetingAction } from "@/features/meetings/meetings-list";
import { getWorkspaceData } from "@/lib/meetflow-data";

export default async function MeetingsPage() {
  const data = await getWorkspaceData();

  const canCreate = ["admin", "chair", "reporter"].includes(data.context?.role ?? "");
  return <>
    <PageHeader eyebrow="Meeting management" title="การประชุม" description="จัดการกำหนดการ วาระ ผู้เข้าร่วม และติดตามสถานะรายงาน" action={canCreate ? <NewMeetingAction /> : undefined} />
    <MeetingsList meetings={data.meetings} departments={data.departments} />
  </>;
}
