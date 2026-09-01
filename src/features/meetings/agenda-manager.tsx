"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePenLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { deleteAgendaItemAction, saveAgendaItemAction } from "@/app/actions/meetings";
import type { MeetingDetailView } from "@/lib/meetflow-data";

type AgendaItem = MeetingDetailView["agenda"][number];

export function AgendaManager({ meetingId, items, canEdit, notify }: { meetingId: string; items: AgendaItem[]; canEdit: boolean; notify: (message: string) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AgendaItem | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  return <section className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
    <div className="flex items-center justify-between gap-3 border-b border-[#e7ebf1] px-5 py-4 sm:px-6">
      <div><h2 className="font-bold text-[#28354c]">ระเบียบวาระการประชุม</h2><p className="mt-0.5 text-xs text-[#8792a5]">หัวข้อที่จะหารือ สาระสำคัญ และมติของที่ประชุม</p></div>
      {canEdit && <Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" />เพิ่มวาระ</Button>}
    </div>
    <div className="divide-y divide-[#e7ebf1]">
      {items.map((item) => <div key={item.id} className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eaf1ff] text-xs font-bold text-[#285eb8]">{item.position}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-bold text-[#2a374d]">{item.title}</h3>{canEdit && <button onClick={() => setEditing(item)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-[#56709a] hover:bg-[#edf3ff] hover:text-[#2563eb]"><FilePenLine className="h-3.5 w-3.5" />แก้ไข</button>}</div>{item.detail && <p className="mt-2 text-sm leading-6 text-[#6b788d]">{item.detail}</p>}<div className="mt-4 rounded-lg border border-[#d8e5df] bg-[#f3faf6] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#568070]">มติที่ประชุม</p><p className="mt-1 text-sm text-[#385b50]">{item.resolution ?? "รอบันทึกมติ"}</p></div></div></div></div>)}
      {!items.length && <div className="px-6 py-10 text-center"><p className="text-sm text-[#7d899b]">ยังไม่มีระเบียบวาระ</p>{canEdit && <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditing("new")}><Plus className="h-4 w-4" />เพิ่มระเบียบวาระแรก</Button>}</div>}
    </div>
    <AgendaDialog
      key={editing === "new" ? "new" : editing?.id ?? "closed"}
      item={editing}
      open={editing !== null}
      pending={isPending}
      onOpenChange={(open) => { if (!open) setEditing(null); }}
      onSave={(values) => startTransition(async () => {
        const result = await saveAgendaItemAction({ meetingId, itemId: editing === "new" ? null : editing?.id, ...values });
        if (!result.ok) return notify(result.error);
        notify(editing === "new" ? "เพิ่มระเบียบวาระแล้ว" : "บันทึกระเบียบวาระแล้ว");
        setEditing(null);
        router.refresh();
      })}
      onDelete={editing && editing !== "new" ? () => {
        if (!window.confirm("ต้องการลบระเบียบวาระนี้ใช่หรือไม่")) return;
        startTransition(async () => {
          const result = await deleteAgendaItemAction(meetingId, editing.id);
          if (!result.ok) return notify(result.error);
          notify("ลบระเบียบวาระแล้ว");
          setEditing(null);
          router.refresh();
        });
      } : undefined}
    />
  </section>;
}

function AgendaDialog({ item, open, pending, onOpenChange, onSave, onDelete }: { item: AgendaItem | "new" | null; open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onSave: (values: { title: string; detail: string; resolution: string }) => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(item && item !== "new" ? item.title : "");
  const [detail, setDetail] = useState(item && item !== "new" ? item.detail ?? "" : "");
  const [resolution, setResolution] = useState(item && item !== "new" ? item.resolution ?? "" : "");

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-[620px]"><div className="border-b border-[#e5e9f1] px-6 py-5"><DialogTitle className="text-lg font-bold text-[#24324a]">{item === "new" ? "เพิ่มระเบียบวาระ" : "แก้ไขระเบียบวาระ"}</DialogTitle><DialogDescription className="mt-1 text-sm text-[#7c889c]">บันทึกหัวข้อ สาระที่หารือ และมติที่ประชุมแยกกันเพื่อใช้สร้างรายงาน</DialogDescription></div><form onSubmit={(event) => { event.preventDefault(); onSave({ title, detail, resolution }); }} className="space-y-4 px-6 py-5"><Field label="ชื่อระเบียบวาระ"><input required minLength={2} value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="เช่น รับรองรายงานการประชุมครั้งที่ผ่านมา" /></Field><Field label="สาระสำคัญ / รายละเอียด"><textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="รายละเอียดที่นำเสนอหรือประเด็นที่หารือ" /></Field><Field label="มติที่ประชุม"><textarea value={resolution} onChange={(event) => setResolution(event.target.value)} rows={3} className={`${fieldClass} h-auto py-3`} placeholder="ผลการพิจารณาหรือสิ่งที่มอบหมาย" /></Field><div className="flex items-center justify-between border-t border-[#e7ebf1] pt-4"><div>{onDelete && <Button type="button" variant="ghost" onClick={onDelete} disabled={pending} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" />ลบวาระ</Button>}</div><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>ยกเลิก</Button><Button type="submit" disabled={pending || title.trim().length < 2}>{pending ? "กำลังบันทึก..." : "บันทึกวาระ"}</Button></div></div></form></DialogContent></Dialog>;
}

const fieldClass = "h-11 w-full rounded-lg border border-[#d8dfeb] bg-white px-3.5 text-sm text-[#29364d] outline-none placeholder:text-[#9ba5b5] focus:border-[#84aaf0] focus:ring-3 focus:ring-[#e7efff]";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">{label}</span>{children}</label>; }
