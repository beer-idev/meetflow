import { notFound } from "next/navigation";
import { PrintReport } from "@/features/reports/print-report";
import { getMeetingDetail } from "@/lib/meetflow-data";

export default async function PrintReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { detail } = await getMeetingDetail(id);
  if (!detail) notFound();
  return <PrintReport detail={detail} />;
}
