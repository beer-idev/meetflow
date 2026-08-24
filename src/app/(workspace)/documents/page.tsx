import { PageHeader } from "@/components/page-header";
import { DocumentsList, UploadButton } from "@/features/documents/documents-list";
import { getDocumentsPageData } from "@/lib/meetflow-data";

export default async function DocumentsPage() {
  const data = await getDocumentsPageData();

  return <>
    <PageHeader eyebrow="Document library" title="คลังเอกสาร" description="ค้นหา จัดหมวดหมู่ ดาวน์โหลด และกำหนดสิทธิ์เอกสารที่เกี่ยวข้อง" action={["admin", "chair", "reporter"].includes(data.context?.role ?? "") ? <UploadButton meetings={data.meetings} /> : undefined} />
    <DocumentsList documents={data.documents} members={data.members} />
  </>;
}
