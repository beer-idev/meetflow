import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#8390a4]">{eyebrow}</p>}<h1 className="text-[26px] font-bold tracking-[-.025em] text-[#17243b] md:text-[30px]">{title}</h1><p className="mt-1.5 text-sm text-[#718097]">{description}</p></div>{action}</div>;
}
