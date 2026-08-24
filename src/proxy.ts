import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthRoute = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/forgot-password";
  const isConfirmRoute = request.nextUrl.pathname === "/auth/confirm";
  const isShareRoute = request.nextUrl.pathname.startsWith("/share/");
  const isSetPasswordRoute = request.nextUrl.pathname === "/set-password";
  const isResetPasswordRoute = request.nextUrl.pathname === "/reset-password";
  const needsPassword = Boolean((user?.invited_at || user?.user_metadata?.must_set_password === true) && user?.user_metadata?.password_set !== true);
  if (!user && !isAuthRoute && !isConfirmRoute && !isShareRoute && !isResetPasswordRoute) return NextResponse.redirect(new URL("/login", request.url));
  if (user && needsPassword && !isSetPasswordRoute && !isShareRoute) return NextResponse.redirect(new URL("/set-password", request.url));
  if (user && !needsPassword && isSetPasswordRoute) return NextResponse.redirect(new URL("/", request.url));
  if (user && isAuthRoute) return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
