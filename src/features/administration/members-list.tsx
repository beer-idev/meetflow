"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { addMemberAction, createMemberAction, setMemberPasswordAction } from "@/app/actions/meetings";
import type { AppRole, MemberOption } from "@/lib/meetflow-data";

const roleOptions: Array<{ value: AppRole; label: string }> = [
  { value: "admin", label: "ผู้ดูแลระบบ" },
  { value: "chair", label: "ประธานการประชุม" },
  { value: "reporter", label: "ผู้จัดทำรายงาน" },
  { value: "reviewer", label: "ผู้ตรวจทาน" },
  { value: "participant", label: "ผู้เข้าร่วมประชุม" },
];

export function MembersList({ members }: { members: MemberOption[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ทุกบทบาท");
  const [selected, setSelected] = useState<MemberOption | null>(null);
  const filtered = useMemo(() => members.filter((person) => `${person.name} ${person.email} ${person.department}`.toLowerCase().includes(query.toLowerCase()) && (role === "ทุกบทบาท" || roleLabel(person.role) === role)), [members, query, role]);

  return <>
    <div className="overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e5eaf1] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e99aa]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ อีเมล หรือหน่วยงาน" className="h-10 w-full rounded-lg border border-[#dbe1eb] pl-10 pr-3 text-sm outline-none focus:border-[#8aaef0] focus:ring-3 focus:ring-[#e8effd]" /></div>
        <select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 rounded-lg border border-[#dbe1eb] bg-white px-3 text-sm text-[#56647a]"><option>ทุกบทบาท</option>{roleOptions.map((option) => <option key={option.value}>{option.label}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead><tr className="border-b border-[#e7ebf1] bg-[#f9fafc] text-[11px] font-bold uppercase tracking-wide text-[#7c889b]"><th className="px-5 py-3.5">ผู้ใช้งาน</th><th className="px-4 py-3.5">หน่วยงาน</th><th className="px-4 py-3.5">บทบาท</th><th className="px-4 py-3.5">สถานะ</th><th className="w-14 px-4 py-3.5"></th></tr></thead>
          <tbody className="divide-y divide-[#e9edf3]">{filtered.map((person) => <tr key={person.id} className="hover:bg-[#f8faff]"><td className="px-5 py-4"><button onClick={() => setSelected(person)} className="flex items-center gap-3 text-left"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e2ebfc] text-[10px] font-bold text-[#315f9f]">{person.initials}</span><span><span className="block text-sm font-semibold text-[#2e3b52] hover:text-[#2563eb]">{person.name}</span><span className="mt-1 block text-[11px] text-[#8a95a7]">{person.email}</span></span></button></td><td className="px-4 py-4 text-sm text-[#5d6a80]">{person.department}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3ff] px-2.5 py-1 text-[10px] font-bold text-[#315eaa]"><ShieldCheck className="h-3 w-3" />{roleLabel(person.role)}</span></td><td className="px-4 py-4"><span className="text-xs font-semibold text-emerald-700">● ใช้งานอยู่</span></td><td className="px-4 py-4"><button onClick={() => setSelected(person)} className="rounded-md p-2 text-[#8b96a8] hover:bg-[#edf1f6]"><MoreHorizontal className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
      </div>
      <div className="border-t border-[#e7ebf1] px-5 py-4 text-xs text-[#7b879a]">แสดง {filtered.length} จาก {members.length} ผู้ใช้งาน</div>
    </div>
    <MemberDetailDialog member={selected} onClose={() => setSelected(null)} />
  </>;
}

export function InviteMemberButton() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />เพิ่มผู้ใช้งาน</Button>
    <MemberFormDialog open={open} onOpenChange={setOpen} />
  </>;
}

export function RolePermissionGuide() {
  const roles: Array<{ name: string; tone: string; items: string[] }> = [
    { name: "ผู้ดูแลระบบ", tone: "bg-[#eaf1ff] text-[#245bb8]", items: ["จัดการผู้ใช้และ role", "จัดการการประชุม เอกสาร และสิทธิ์", "ดูประวัติการใช้งาน"] },
    { name: "ประธานการประชุม", tone: "bg-[#eef8f5] text-[#24725e]", items: ["สร้างและแก้ไขการประชุม", "จัดผู้เข้าร่วมและแชร์เอกสาร", "ตรวจทานและเผยแพร่รายงาน"] },
    { name: "ผู้จัดทำรายงาน", tone: "bg-[#fff5e6] text-[#9a6417]", items: ["สร้างการประชุมและอัปโหลดเอกสาร", "จัดทำรายงานและแก้ไขฉบับร่าง", "แชร์เอกสารในการประชุมที่รับผิดชอบ"] },
    { name: "ผู้ตรวจทาน", tone: "bg-[#f3edff] text-[#7042ae]", items: ["อ่านการประชุมและรายงานที่ได้รับมอบหมาย", "ดาวน์โหลดเอกสารที่มีสิทธิ์", "ไม่มีสิทธิ์แก้ไขหรือแชร์"] },
    { name: "ผู้เข้าร่วมประชุม", tone: "bg-[#f2f4f7] text-[#59677d]", items: ["ดูการประชุมที่ได้รับเชิญ", "อ่านและดาวน์โหลดเอกสารที่ได้รับสิทธิ์", "ไม่มีสิทธิ์แก้ไขหรือแชร์"] },
  ];
  return <section className="mt-6 rounded-xl border border-[#dfe5ef] bg-white p-5 sm:p-6"><div><h2 className="font-bold text-[#28354c]">ขอบเขตสิทธิ์แต่ละบทบาท</h2><p className="mt-1 text-sm text-[#7d899d]">สิทธิ์ในฐานข้อมูลยังตรวจสอบด้วย Supabase RLS ไม่ได้อาศัยการซ่อนเมนูเพียงอย่างเดียว</p></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{roles.map((role) => <div key={role.name} className="rounded-lg border border-[#e3e8f0] p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${role.tone}`}>{role.name}</span><ul className="mt-3 space-y-2 text-xs leading-5 text-[#68768c]">{role.items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8aa8df]" />{item}</li>)}</ul></div>)}</div></section>;
}

function MemberFormDialog({ open, onOpenChange, member }: { open: boolean; onOpenChange: (open: boolean) => void; member?: MemberOption }) {
  const router = useRouter();
  const [email, setEmail] = useState(member?.email ?? "");
  const [displayName, setDisplayName] = useState(member?.name ?? "");
  const [role, setRole] = useState<AppRole>(member?.role ?? "participant");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const submit = () => {
    setMessage("");
    if (!member && password.length < 8) return setMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (password && password !== passwordConfirmation) return setMessage("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
    startTransition(async () => {
      const result = member ? await addMemberAction(email, role) : await createMemberAction(displayName, email, password, role);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (member && password) {
        const passwordResult = await setMemberPasswordAction(member.id, password);
        if (!passwordResult.ok) { setMessage(passwordResult.error); return; }
      }
      onOpenChange(false);
      router.refresh();
    });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[520px]">
      <div className="border-b border-[#e5e9f1] px-6 py-5"><DialogTitle className="text-lg font-bold text-[#24324a]">{member ? "แก้ไขผู้ใช้งาน" : "สร้างผู้ใช้งาน"}</DialogTitle><DialogDescription className="mt-1 text-sm text-[#7c889c]">{member ? "เปลี่ยนบทบาทหรือกำหนดรหัสผ่านใหม่ให้สมาชิก" : "สร้างบัญชีพร้อมรหัสผ่านและกำหนด role ได้ทันที"}</DialogDescription></div>
      <div className="space-y-4 px-6 py-5">
        {!member && <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">ชื่อที่แสดง</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm" placeholder="เช่น สมชาย ใจดี" /></label>}
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">อีเมล</span><input value={email} onChange={(event) => setEmail(event.target.value)} disabled={Boolean(member)} className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm disabled:bg-[#f4f6f9]" placeholder="user@example.com" /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">บทบาท</span><select value={role} onChange={(event) => setRole(event.target.value as AppRole)} className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm">{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">{member ? "ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm" placeholder="อย่างน้อย 8 ตัวอักษร" /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3a465c]">ยืนยันรหัสผ่าน</span><input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="h-10 w-full rounded-lg border border-[#d9e0ea] px-3 text-sm" placeholder="กรอกรหัสผ่านอีกครั้ง" /></label>
        {message && <p className="rounded-lg bg-[#fff0eb] px-3 py-2 text-sm font-semibold text-[#b84a24]">{message}</p>}
        <div className="flex justify-end gap-2 border-t border-[#e7ebf1] pt-4"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>ยกเลิก</Button><Button type="button" disabled={isPending} onClick={submit}>{isPending ? "กำลังดำเนินการ..." : member ? "บันทึกการเปลี่ยนแปลง" : "สร้างผู้ใช้งาน"}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}

function MemberDetailDialog({ member, onClose }: { member: MemberOption | null; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  if (!member) return null;
  return <>
    <Dialog open={Boolean(member) && !editing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[520px]">
        <div className="border-b border-[#e5e9f1] px-6 py-5"><DialogTitle className="text-lg font-bold text-[#24324a]">{member.name}</DialogTitle><DialogDescription className="mt-1 text-sm text-[#7c889c]">{member.email}</DialogDescription></div>
        <div className="space-y-3 px-6 py-5 text-sm text-[#536078]"><Info label="บทบาท" value={roleLabel(member.role)} /><Info label="หน่วยงาน/สิทธิ์" value={member.department} /><Info label="สถานะ" value="ใช้งานอยู่" /><div className="flex justify-end gap-2 border-t border-[#e7ebf1] pt-4"><Button variant="secondary" onClick={onClose}>ปิด</Button><Button onClick={() => setEditing(true)}>แก้ไขบทบาท</Button></div></div>
      </DialogContent>
    </Dialog>
    <MemberFormDialog open={editing} onOpenChange={(open) => { setEditing(open); if (!open) onClose(); }} member={member} />
  </>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <p className="flex items-center justify-between gap-4"><span className="text-[#8994a6]">{label}</span><span className="font-semibold text-[#334057]">{value}</span></p>;
}

function roleLabel(role: AppRole) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}
