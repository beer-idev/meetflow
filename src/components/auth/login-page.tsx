import { Files } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPageCentered() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4 py-10 sm:px-6">
      <section className="w-full max-w-[430px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563eb] text-white shadow-sm shadow-blue-200">
            <Files className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-xl font-bold tracking-tight text-[#17243c]">
              MeetFlow
            </span>
            <span className="block text-[11px] text-[#8290a7]">
              Digital Meeting Workspace
            </span>
          </span>
        </div>
        <div className="rounded-2xl border border-[#dfe5ef] bg-white p-7 shadow-[0_20px_60px_rgba(30,58,110,.08)] sm:p-9">
          <h1 className="text-center text-[28px] font-bold tracking-[-.025em] text-[#16233b]">
            เข้าสู่ระบบ
          </h1>
          <LoginForm />
        </div>
        <p className="mt-5 text-center text-xs text-[#919cad]">
          © 2569 MeetFlow · ระบบสารสนเทศเพื่อการจัดการประชุม
        </p>
      </section>
    </main>
  );
}
