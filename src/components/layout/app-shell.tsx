"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, CalendarDays, ChevronDown, FileClock, Files, History, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/search/global-search";
import { signOutAction } from "@/app/actions/auth";
import type { AppContext, AppRole } from "@/lib/meetflow-data";

type NavItem = { label: string; href: string; icon: LucideIcon; roles?: AppRole[] };
const navigation: NavItem[] = [
  { label: "ภาพรวมงาน", href: "/", icon: LayoutDashboard },
  { label: "การประชุม", href: "/meetings", icon: CalendarDays },
  { label: "รายงานการประชุม", href: "/reports", icon: FileClock },
  { label: "คลังเอกสาร", href: "/documents", icon: Files },
];
const administration: NavItem[] = [
  { label: "ผู้ใช้งานและสิทธิ์", href: "/members", icon: Users, roles: ["admin"] },
  { label: "ประวัติการใช้งาน", href: "/audit", icon: History, roles: ["admin"] },
];

export function AppShell({ children, context, documentCount = 0 }: { children: React.ReactNode; context: AppContext | null; documentCount?: number }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const visibleNavigation = navigation.filter((item) => !item.roles || (context?.role && item.roles.includes(context.role)));
  const visibleAdministration = administration.filter((item) => !item.roles || (context?.role && item.roles.includes(context.role)));
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {mobileOpen && <button aria-label="ปิดเมนู" className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-[#dfe5ef] bg-white transition-transform duration-200 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-18 items-center justify-between border-b border-[#e7ebf2] px-5">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#2563eb] text-white shadow-sm shadow-blue-300"><Files className="h-[19px] w-[19px]" /></span>
            <span><span className="block text-[18px] font-bold tracking-[-.025em] text-[#17243c]">MeetFlow</span><span className="block text-[10px] font-medium text-[#8290a7]">Meeting workspace</span></span>
          </Link>
          <button aria-label="ปิดเมนู" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="soft-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <NavGroup label="พื้นที่ทำงาน" items={visibleNavigation} active={active} onNavigate={() => setMobileOpen(false)} />
          {visibleAdministration.length > 0 && <NavGroup label="จัดการองค์กร" items={visibleAdministration} active={active} onNavigate={() => setMobileOpen(false)} className="mt-7" />}
        </nav>

        <div className="border-t border-[#e7ebf2] p-4">
            <div className="rounded-xl border border-[#dbe6fb] bg-[#f4f7fe] p-3.5">
            <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-semibold text-[#314569]"><ShieldCheck className="h-4 w-4 text-[#2563eb]" />พื้นที่จัดเก็บ</span><span className="text-[#73819a]">{documentCount} ไฟล์</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dfe7f5]"><div className="h-full w-[12%] rounded-full bg-[#3b82f6]" /></div>
            <p className="mt-2 text-[11px] text-[#8090aa]">ไฟล์จริงในคลังเอกสาร</p>
          </div>
          <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#65738b] hover:bg-[#f2f5fa] hover:text-[#263957]"><Settings className="h-[17px] w-[17px]" />ตั้งค่าระบบ</button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-[#e2e7ef] bg-white/95 px-4 backdrop-blur md:px-7 lg:px-9">
          <button aria-label="เปิดเมนู" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#536179] hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <button aria-label="การแจ้งเตือน" className="relative rounded-lg p-2.5 text-[#5e6d84] hover:bg-[#f1f4f9]"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#ef4444]" /></button>
            <div className="hidden h-7 w-px bg-[#e2e7ef] sm:block" />
            <div className="relative">
              <button onClick={() => setUserOpen((value) => !value)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-[#f2f5f9]"><Avatar initials={initials(context?.profile.displayName ?? "ผู้ใช้")} /><span className="hidden text-left md:block"><span className="block text-sm font-semibold leading-4 text-[#27344c]">{context?.profile.displayName ?? "ผู้ใช้งาน"}</span><span className="text-[11px] text-[#8491a7]">{context ? roleLabel(context.role) : "บัญชี MeetFlow"}</span></span><ChevronDown className="hidden h-4 w-4 text-[#8a97aa] md:block" /></button>
              {userOpen && <div className="absolute right-0 top-12 w-64 rounded-xl border border-[#dfe4ed] bg-white p-1.5 shadow-xl shadow-slate-900/10"><div className="border-b border-[#edf0f5] px-3 py-2.5"><p className="text-sm font-semibold">{context?.profile.displayName ?? "ผู้ใช้งาน"}</p><p className="mt-0.5 truncate text-xs text-[#7b879b]">{context?.profile.email ?? ""}</p></div><form action={signOutAction}><button type="submit" className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#526078] hover:bg-[#f4f6fa]"><LogOut className="h-4 w-4" />ออกจากระบบ</button></form></div>}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-7 md:px-7 lg:px-9 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({ label, items, active, onNavigate, className }: { label: string; items: NavItem[]; active: (href: string) => boolean; onNavigate: () => void; className?: string }) {
  return <div className={className}><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#99a4b5]">{label}</p><div className="space-y-1">{items.map(({ label: itemLabel, href, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", active(href) ? "bg-[#eaf1ff] text-[#1d57bf]" : "text-[#5f6d83] hover:bg-[#f4f6fa] hover:text-[#273954]")}><Icon className={cn("h-[18px] w-[18px]", active(href) && "text-[#2563eb]")} />{itemLabel}</Link>)}</div></div>;
}

export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) { return <span className={cn("grid shrink-0 place-items-center rounded-full bg-[#e0eaff] font-bold text-[#2d5da7]", size === "sm" ? "h-8 w-8 text-[10px]" : "h-9 w-9 text-xs")}>{initials}</span>; }

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("") || "ผ"; }
function roleLabel(role: AppRole) { return ({ admin: "ผู้ดูแลระบบ", chair: "ประธานการประชุม", reporter: "ผู้จัดทำรายงาน", reviewer: "ผู้ตรวจทาน", participant: "ผู้เข้าร่วมประชุม" } as Record<AppRole, string>)[role]; }
