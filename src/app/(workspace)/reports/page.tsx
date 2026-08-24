import { PageHeader } from "@/components/page-header";
import { ReportsList } from "@/features/reports/reports-list";
import { getWorkspaceData } from "@/lib/meetflow-data";

export default async function ReportsPage() {
  const data = await getWorkspaceData();

  return <>
    <PageHeader eyebrow="Report workflow" title="รายงานการประชุม" description="จัดทำ ตรวจทาน อนุมัติ และเผยแพร่รายงานตามขั้นตอน" />
    <ReportsList reports={data.reports} role={data.context?.role ?? null} />
  </>;
}
