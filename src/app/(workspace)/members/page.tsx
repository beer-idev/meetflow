import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { InviteMemberButton, MembersList, RolePermissionGuide } from "@/features/administration/members-list";
import { getWorkspaceData } from "@/lib/meetflow-data";

export default async function MembersPage() {
  const data = await getWorkspaceData();
  if (data.context?.role !== "admin") return <AccessDenied />;

  return <>
    <PageHeader eyebrow="Role-based access control" title="ผู้ใช้งานและสิทธิ์" description="จัดการสมาชิก บทบาท และสิทธิ์เข้าถึงข้อมูลขององค์กร" action={<InviteMemberButton />} />
    <MembersList members={data.members} />
    <RolePermissionGuide />
  </>;
}
