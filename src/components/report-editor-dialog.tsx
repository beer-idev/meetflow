"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ReportEditorDialog({ open, onOpenChange, title, initialContent, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; initialContent?: Record<string, unknown> | null; onSave: (content: Record<string, unknown>, plainText: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: (initialContent as JSONContent | null) ?? { type: "doc", content: [] },
  });

  const tools = [
    { label: "ตัวหนา", icon: Bold, active: editor?.isActive("bold"), run: () => editor?.chain().focus().toggleBold().run() },
    { label: "ตัวเอียง", icon: Italic, active: editor?.isActive("italic"), run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "หัวข้อ", icon: Heading2, active: editor?.isActive("heading", { level: 2 }), run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "รายการ", icon: List, active: editor?.isActive("bulletList"), run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "ลำดับ", icon: ListOrdered, active: editor?.isActive("orderedList"), run: () => editor?.chain().focus().toggleOrderedList().run() },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[920px]" showClose={false}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e4e9f1] px-6 py-5 sm:px-8">
          <div><DialogTitle className="text-xl font-bold text-[#1c2a43]">บันทึกรายงานการประชุม</DialogTitle><DialogDescription className="mt-1 text-sm text-[#78859a]">{title}</DialogDescription></div>
          <span className="rounded-full bg-[#fff4dd] px-3 py-1 text-xs font-semibold text-[#98691a]">ฉบับร่าง</span>
        </div>
        <div className="border-b border-[#e5e9f1] bg-[#f8faff] px-6 py-2 sm:px-8">
          <div className="flex flex-wrap items-center gap-1">
            {tools.map(({ label, icon: Icon, active, run }) => <button key={label} title={label} onClick={run} className={cn("rounded-md p-2 text-[#627087] hover:bg-[#e9eef7]", active && "bg-[#dfeaff] text-brand")}><Icon className="h-4 w-4" /></button>)}
            <span className="mx-1 h-5 w-px bg-[#d8ddd8]" />
            <button title="ย้อนกลับ" onClick={() => editor?.chain().focus().undo().run()} className="rounded-md p-2 text-[#5f6b67] hover:bg-[#e8ece8]"><Undo2 className="h-4 w-4" /></button>
            <button title="ทำซ้ำ" onClick={() => editor?.chain().focus().redo().run()} className="rounded-md p-2 text-[#5f6b67] hover:bg-[#e8ece8]"><Redo2 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="editor-content max-h-[55vh] overflow-y-auto px-6 py-6 sm:px-10"><EditorContent editor={editor} /></div>
        <div className="flex flex-col-reverse gap-3 border-t border-[#e4e9f1] bg-[#f8faff] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs text-[#7e8985]">เนื้อหาจะถูกบันทึกเป็นฉบับร่างและสร้างเวอร์ชันใหม่</p>
          <div className="flex gap-3"><DialogClose asChild><Button variant="secondary">ปิดก่อน</Button></DialogClose><Button onClick={() => { if (!editor) return; onSave(editor.getJSON() as Record<string, unknown>, editor.getText()); onOpenChange(false); }}>บันทึกฉบับร่าง</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
