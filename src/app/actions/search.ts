"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  id: string;
  kind: "meeting" | "document" | "report";
  title: string;
  meta: string;
  href: string;
};

type SearchResultResponse = { ok: true; data: SearchResult[] } | { ok: false; error: string };

export async function globalSearchAction(query: string): Promise<SearchResultResponse> {
  const parsed = z.string().trim().min(1).max(120).safeParse(query);
  if (!parsed.success) return { ok: true, data: [] };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "กรุณาเข้าสู่ระบบอีกครั้ง" };

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return { ok: false, error: "ไม่พบสิทธิ์เข้าใช้งานองค์กร" };

  const term = parsed.data;
  const escaped = term.replaceAll("%", "\\%").replaceAll("_", "\\_");
  const [meetings, documents, reports] = await Promise.all([
    supabase.rpc("search_meetings", {
      p_organization_id: membership.organization_id,
      p_query: term,
      p_limit: 5,
      p_offset: 0,
    }),
    supabase
      .from("attachments")
      .select("id,file_name,category,meeting_id,created_at")
      .eq("organization_id", membership.organization_id)
      .ilike("file_name", `%${escaped}%`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("reports")
      .select("id,meeting_id,plain_text,updated_at")
      .ilike("plain_text", `%${escaped}%`)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const result: SearchResult[] = [
    ...((meetings.data ?? []) as Array<{ id: string; title: string; meeting_type: string; department_name: string | null }>).map((item) => ({
      id: item.id,
      kind: "meeting" as const,
      title: item.title,
      meta: [item.department_name, item.meeting_type].filter(Boolean).join(" · "),
      href: `/meetings/${item.id}`,
    })),
    ...((documents.data ?? []) as Array<{ id: string; file_name: string; category: string }>).map((item) => ({
      id: item.id,
      kind: "document" as const,
      title: item.file_name,
      meta: item.category,
      href: "/documents",
    })),
    ...((reports.data ?? []) as Array<{ id: string; meeting_id: string; plain_text: string | null }>).map((item) => ({
      id: item.id,
      kind: "report" as const,
      title: (item.plain_text ?? "").split("\n").find(Boolean)?.slice(0, 80) || "รายงานการประชุม",
      meta: "รายงานการประชุม",
      href: `/meetings/${item.meeting_id}?tab=minutes`,
    })),
  ];

  return { ok: true, data: result.slice(0, 12) };
}
