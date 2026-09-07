"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronLeft, Clock3, GripVertical, Link2, MapPin, Plus, QrCode, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { meetingSchema, type MeetingFormValues } from "@/lib/meeting-schema";
import { createMeetingAction } from "@/app/actions/meetings";
import type { DepartmentOption } from "@/lib/meetflow-data";

const field = "h-11 w-full rounded-lg border border-[#d8dfeb] bg-white px-3.5 text-sm text-[#29364d] outline-none placeholder:text-[#9ba5b5] focus:border-[#84aaf0] focus:ring-3 focus:ring-[#e7efff]";

export function MeetingCreateForm({ departments }: { departments: DepartmentOption[] }) {
  const router = useRouter();
  const [agendas, setAgendas] = useState(["เรื่องประธานแจ้งให้ที่ประชุมทราบ", "รับรองรายงานการประชุมครั้งที่ผ่านมา", "เรื่องเสนอเพื่อพิจารณา"]);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [endTime, setEndTime] = useState("12:00");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: { title: "", date: new Date().toISOString().slice(0, 10), startTime: "09:30", meetingMode: "onsite", location: "ห้องประชุมใหญ่ ชั้น 4", onlineUrl: "", type: "คณะกรรมการ", description: "" },
  });
  const meetingMode = watch("meetingMode");

  const submit = (values: MeetingFormValues) => {
    setFormError("");
    startTransition(async () => {
      const result = await createMeetingAction({
        ...values,
        departmentId: departmentId || null,
        endTime,
        participantIds: [],
        agendaTitles: agendas.filter((agenda) => agenda.trim().length > 0),
      });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.push(`/meetings/${result.data.id}`);
    });
  };

  return <form onSubmit={handleSubmit(submit)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div className="space-y-6">
      <section className="rounded-xl border border-[#dfe5ef] bg-white">
        <SectionHeading step="1" title="ข้อมูลการประชุม" description="ข้อมูลพื้นฐานที่ใช้ในหนังสือเชิญและรายงาน" />
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="ชื่อการประชุม" error={errors.title?.message} wide><input className={field} placeholder="เช่น ประชุมคณะกรรมการบริหาร ครั้งที่ 9/2569" {...register("title")} /></Field>
          <Field label="ประเภทการประชุม" error={errors.type?.message}><select className={field} {...register("type")}><option>คณะกรรมการ</option><option>ประชุมภายใน</option><option>โครงการ</option><option>ประชุมภายนอก</option></select></Field>
          <Field label="หน่วยงานผู้รับผิดชอบ"><select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={field}>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
          <Field label="วันที่" icon={<CalendarDays />} error={errors.date?.message}><input type="date" className={field} {...register("date")} /></Field>
          <Field label="เวลาเริ่ม" icon={<Clock3 />} error={errors.startTime?.message}><input type="time" className={field} {...register("startTime")} /></Field>
          <Field label="เวลาสิ้นสุด" icon={<Clock3 />}><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={field} /></Field>
          <Field label="รูปแบบการประชุม" wide><select className={field} {...register("meetingMode")}><option value="onsite">Onsite / ห้องประชุม</option><option value="online">Online / ออนไลน์</option><option value="hybrid">Hybrid / ผสม</option></select></Field>
          {(meetingMode === "onsite" || meetingMode === "hybrid") && <Field label="สถานที่" icon={<MapPin />} error={errors.location?.message} wide><input className={field} placeholder="เช่น ห้องประชุมใหญ่ ชั้น 4" {...register("location")} /></Field>}
          {(meetingMode === "online" || meetingMode === "hybrid") && <Field label="ลิงก์ประชุมออนไลน์" icon={<Link2 />} error={errors.onlineUrl?.message} wide><input type="url" className={field} placeholder="https://meet.google.com/... หรือ Zoom" {...register("onlineUrl")} /></Field>}
          <Field label="รายละเอียดเพิ่มเติม" error={errors.description?.message} wide><textarea rows={3} className={`${field} h-auto resize-none py-3`} placeholder="วัตถุประสงค์หรือข้อมูลที่ผู้เข้าร่วมควรทราบ" {...register("description")} /></Field>
        </div>
      </section>

      <section className="rounded-xl border border-[#dfe5ef] bg-white">
        <SectionHeading step="2" title="ลงชื่อผู้เข้าร่วมด้วย QR Code" description="ระบบจะสร้าง QR Code หลังจากบันทึกการประชุม" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#edf3ff] text-[#2d63ba]"><QrCode className="h-8 w-8" /></span><div><h3 className="font-bold text-[#30405b]">ไม่ต้องพิมพ์รายชื่อผู้เข้าร่วมล่วงหน้า</h3><p className="mt-1 text-sm leading-6 text-[#748197]">เมื่อบันทึกแล้ว ให้นำ QR Code ในหน้าการประชุมไปแสดง ผู้เข้าร่วมกรอกชื่อ ตำแหน่ง และหน่วยงานด้วยตนเอง รายชื่อจะเข้าในรายงาน PDF อัตโนมัติ</p></div></div>
      </section>

      <section className="rounded-xl border border-[#dfe5ef] bg-white">
        <SectionHeading step="3" title="ระเบียบวาระ" description="เรียงลำดับหัวข้อที่จะใช้บันทึกมติและสรุปผล" action={<button type="button" onClick={() => setAgendas((current) => [...current, ""])} className="flex items-center gap-1.5 text-xs font-semibold text-[#2563eb]"><Plus className="h-4 w-4" />เพิ่มวาระ</button>} />
        <div className="space-y-2 p-5 sm:p-6">{agendas.map((agenda, index) => <div key={index} className="flex items-center gap-2"><GripVertical className="h-4 w-4 shrink-0 text-[#a4adbb]" /><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf3ff] text-xs font-bold text-[#2e62b7]">{index + 1}</span><input value={agenda} onChange={(event) => setAgendas((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className={`${field} h-10`} placeholder="ชื่อระเบียบวาระ" /><button type="button" onClick={() => setAgendas((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="p-2 text-[#98a2b2] hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>)}</div>
      </section>
    </div>

    <aside className="space-y-4">
      <div className="sticky top-24 rounded-xl border border-[#d8e2f3] bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[#29364c]">ตรวจสอบก่อนบันทึก</h2>
        <div className="mt-4 space-y-3"><CheckRow text="ข้อมูลการประชุม" /><CheckRow text="สร้าง QR ลงชื่ออัตโนมัติ" /><CheckRow text={`ระเบียบวาระ ${agendas.filter(Boolean).length} หัวข้อ`} /></div>
        {formError && <p className="mt-4 rounded-lg bg-[#fff0eb] px-3 py-2 text-sm font-semibold text-[#b84a24]">{formError}</p>}
        <div className="mt-5 border-t border-[#e7ebf1] pt-5"><Button type="submit" className="w-full" disabled={isPending}>{isPending ? "กำลังบันทึก..." : "บันทึกการประชุม"}</Button><Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => router.back()}><ChevronLeft className="h-4 w-4" />ยกเลิกและย้อนกลับ</Button></div>
      </div>
    </aside>
  </form>;
}

function SectionHeading({ step, title, description, action }: { step: string; title: string; description: string; action?: React.ReactNode }) { return <div className="flex items-center justify-between gap-3 border-b border-[#e7ebf1] px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#2563eb] text-xs font-bold text-white">{step}</span><div><h2 className="font-bold text-[#27344b]">{title}</h2><p className="mt-0.5 text-xs text-[#8792a4]">{description}</p></div></div>{action}</div>; }
function Field({ label, error, icon, wide, children }: { label: string; error?: string; icon?: React.ReactNode; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#3a465c]">{icon && <span className="[&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#7e8a9e]">{icon}</span>}{label}</span>{children}{error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}</label>; }
function CheckRow({ text }: { text: string }) { return <p className="flex items-center gap-2 text-sm text-[#5e6c83]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#e6f6ef] text-[#278064]"><Check className="h-3 w-3" /></span>{text}</p>; }
