import { Files } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() { return <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-5 py-10"><div className="w-full max-w-[430px]"><div className="mb-7 flex items-center justify-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#2563eb] text-white"><Files className="h-[18px] w-[18px]" /></span><span className="text-xl font-bold text-[#17243c]">MeetFlow</span></div><div className="rounded-2xl border border-[#dfe5ef] bg-white p-7 shadow-[0_20px_60px_rgba(30,58,110,.08)] sm:p-9"><ForgotPasswordForm /></div></div></main>; }
