import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const supabase = await createClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: { message: "ลิงก์ยืนยันไม่ครบถ้วน" } };

  if (result.error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ")}`, url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/set-password";
}
