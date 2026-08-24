import Link from "next/link";
import { ShieldX } from "lucide-react";

export function AccessDenied({ description = "หน้านี้สำหรับผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น" }: { description?: string }) {
  return <div className="grid min-h-[420px] place-items-center rounded-xl border border-[#dfe5ef] bg-white px-6 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff1ef] text-[#c45445]"><ShieldX className="h-5 w-5" /></span><h1 className="mt-4 text-lg font-bold text-[#26344c]">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1><p className="mt-2 text-sm text-[#7e8ba0]">{description}</p><Link href="/" className="mt-5 inline-flex rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]">กลับหน้าภาพรวม</Link></div></div>;
}
