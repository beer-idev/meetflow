import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/access-denied";
import { AuditList } from "@/features/administration/audit-list";
import { getAuditPageData } from "@/lib/meetflow-data";

export default async function AuditPage() {
  const data = await getAuditPageData();
  if (data.context?.role !== "admin") return <AccessDenied />;

  return <>
    <PageHeader eyebrow="Audit trail" title="ประวัติการใช้งาน" description="ตรวจสอบการเข้าสู่ระบบ การแก้ไข การแชร์ และการดาวน์โหลดเอกสาร" />
    <AuditList logs={data.auditLogs} />
  </>;
}
