import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetFlow — ระบบจัดการประชุมและรายงาน",
  description: "จัดการการประชุม รายงาน และเอกสารขององค์กรในที่เดียว",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
