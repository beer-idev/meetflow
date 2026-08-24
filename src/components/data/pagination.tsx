"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, totalItems, pageSize, onPageChange }: { page: number; totalItems: number; pageSize: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1);
  return <div className="flex flex-col gap-3 border-t border-[#e7ebf1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[#7c889b]">แสดง {start}–{end} จาก {totalItems} รายการ</p><div className="flex items-center gap-1"><PageButton label="ก่อนหน้า" disabled={page === 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-4 w-4" /></PageButton>{pages.map((value, index) => <span key={value} className="contents">{index > 0 && pages[index - 1] !== value - 1 && <span className="px-1 text-[#9ca6b5]">…</span>}<button onClick={() => onPageChange(value)} className={cn("h-8 min-w-8 rounded-md px-2 text-xs font-semibold", value === page ? "bg-[#2563eb] text-white" : "text-[#647187] hover:bg-[#eef2f8]")}>{value}</button></span>)}<PageButton label="ถัดไป" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-4 w-4" /></PageButton></div></div>;
}
function PageButton({ children, label, disabled, onClick }: { children: React.ReactNode; label: string; disabled: boolean; onClick: () => void }) { return <button aria-label={label} disabled={disabled} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-md border border-[#dce2ec] text-[#627087] hover:bg-[#f3f6fa] disabled:cursor-not-allowed disabled:opacity-40">{children}</button>; }
