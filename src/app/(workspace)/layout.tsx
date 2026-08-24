import { AppShell } from "@/components/layout/app-shell";
import { getShellData } from "@/lib/meetflow-data";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const data = await getShellData();
  return <AppShell context={data.context} documentCount={data.documentCount}>{children}</AppShell>;
}
