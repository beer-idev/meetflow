import { AppShell } from "@/components/layout/app-shell";
import { getWorkspaceData } from "@/lib/meetflow-data";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const data = await getWorkspaceData();
  return <AppShell context={data.context} documentCount={data.documents.length}>{children}</AppShell>;
}
