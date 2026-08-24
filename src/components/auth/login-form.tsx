"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.email("กรุณาระบุอีเมลให้ถูกต้อง"), password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"), remember: z.boolean() });
type Values = z.infer<typeof schema>;
const inputClass = "h-11 w-full rounded-lg border border-[#d8dfeb] bg-white pl-10 pr-3 text-sm text-[#26334a] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#77a2ef] focus:ring-3 focus:ring-[#e5edff]";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  const submit = async (values: Values) => {
    setServerError("");
    const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
    if (!configured) { setServerError("ระบบยังไม่ได้ตั้งค่า Supabase กรุณาติดต่อผู้ดูแลระบบ"); return; }
    const { error } = await createClient().auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) { setServerError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง"); return; }
    router.push("/");
    router.refresh();
  };

  return <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[#344159]">อีเมล</span><span className="relative block"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d99ab]" /><input type="email" autoComplete="email" className={inputClass} placeholder="name@organization.go.th" {...register("email")} /></span>{errors.email && <span className="mt-1.5 block text-xs text-red-600">{errors.email.message}</span>}</label>
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[#344159]">รหัสผ่าน</span><span className="relative block"><LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d99ab]" /><input type={showPassword ? "text" : "password"} autoComplete="current-password" className={`${inputClass} pr-10`} placeholder="กรอกรหัสผ่าน" {...register("password")} /><button type="button" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8490a3]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>{errors.password && <span className="mt-1.5 block text-xs text-red-600">{errors.password.message}</span>}</label>
    <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-[#66738a]"><input type="checkbox" className="h-4 w-4 rounded border-[#cbd4e2] accent-[#2563eb]" {...register("remember")} />จดจำการเข้าสู่ระบบ</label><Link href="/forgot-password" className="text-sm font-semibold text-[#2563eb] hover:underline">ลืมรหัสผ่าน?</Link></div>
    {serverError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{serverError}</div>}
    <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{isSubmitting ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}</Button>
  </form>;
}
