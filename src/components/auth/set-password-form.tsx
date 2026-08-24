"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm({ mode = "invite" }: { mode?: "invite" | "reset" }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (password !== confirmation) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");

    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password, data: { password_set: true } });
    setLoading(false);
    if (updateError) return setError("ตั้งรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    router.replace("/");
    router.refresh();
  };

  const isReset = mode === "reset";
  return <form onSubmit={submit} className="mt-7 space-y-5">
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[#344159]">รหัสผ่านใหม่</span><span className="relative block"><KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d99ab]" /><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-lg border border-[#d8dfeb] pl-10 pr-10 text-sm outline-none focus:border-[#77a2ef] focus:ring-3 focus:ring-[#e5edff]" placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" /><button type="button" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8490a3]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold text-[#344159]">ยืนยันรหัสผ่าน</span><input required type={showPassword ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-11 w-full rounded-lg border border-[#d8dfeb] px-3 text-sm outline-none focus:border-[#77a2ef] focus:ring-3 focus:ring-[#e5edff]" placeholder="กรอกรหัสผ่านอีกครั้ง" autoComplete="new-password" /></label>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
    <Button type="submit" className="w-full" disabled={loading}>{loading && <LoaderCircle className="h-4 w-4 animate-spin" />}{loading ? "กำลังบันทึก" : isReset ? "บันทึกรหัสผ่านใหม่" : "ตั้งรหัสผ่านและเข้าสู่ระบบ"}</Button>
  </form>;
}
