import { notFound } from "next/navigation";
import { SharedReportPrint } from "@/features/reports/shared-report-print";
import { getSharedReport } from "@/lib/shared-report-server";

export default async function SharedReportPrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getSharedReport(token);
  if (!report) notFound();
  return <SharedReportPrint report={report} />;
}
