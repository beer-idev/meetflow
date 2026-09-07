"use client";

import { useRef, useSyncExternalStore } from "react";
import { Copy, Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

export function AttendanceQrPanel({ meetingId, meetingTitle, registeredCount, notify }: { meetingId: string; meetingTitle: string; registeredCount: number; notify: (message: string) => void }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => "");
  const url = origin ? `${origin}/attendance/${meetingId}` : "";

  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    notify("คัดลอกลิงก์ลงชื่อแล้ว");
  };
  const download = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `QR-${meetingTitle.replace(/[^a-zA-Z0-9ก-๙]+/g, "-")}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <div className="grid gap-5 border-b border-[#e7ebf1] bg-[#f8faff] px-5 py-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:px-6">
    <div ref={qrRef} className="mx-auto grid h-40 w-40 place-items-center rounded-xl border border-[#d8e2f2] bg-white p-3 shadow-sm">{url ? <QRCodeSVG value={url} size={132} level="M" includeMargin={false} /> : <QrCode className="h-12 w-12 text-[#9aa8bc]" />}</div>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#293a57]">QR Code สำหรับลงชื่อเข้าร่วม</h3><span className="rounded-full bg-[#e5f5ee] px-2.5 py-1 text-[11px] font-bold text-[#26765c]">ลงชื่อแล้ว {registeredCount} คน</span></div><p className="mt-2 text-sm leading-6 text-[#69778d]">ให้ผู้เข้าร่วมสแกนและกรอกชื่อ ตำแหน่ง และหน่วยงาน รายชื่อจะเข้าไฟล์รายงานอัตโนมัติ</p><div className="mt-3 flex min-w-0 items-center gap-2 rounded-lg border border-[#dce4ef] bg-white p-2"><input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 text-xs text-[#66758c] outline-none" /><button type="button" onClick={copy} aria-label="คัดลอกลิงก์" className="rounded-md p-2 text-[#4b6fa8] hover:bg-[#edf3fd]"><Copy className="h-4 w-4" /></button></div><div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" onClick={copy}><Copy className="h-4 w-4" />คัดลอกลิงก์</Button><Button type="button" size="sm" variant="secondary" onClick={download}><Download className="h-4 w-4" />ดาวน์โหลด QR</Button></div></div>
  </div>;
}
