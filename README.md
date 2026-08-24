# MeetFlow

ระบบจัดการการประชุม รายงาน และเอกสารสำหรับองค์กร ออกแบบตามลำดับงานจริงตั้งแต่เตรียมประชุม บันทึกรายงาน ตรวจทาน เผยแพร่ ไปจนถึงค้นหาและตรวจสอบประวัติ

## เริ่มใช้งาน

ต้องมี Node.js 20 ขึ้นไป จากนั้นรัน:

```bash
npm install
copy .env.example .env.local
npm run dev
```

เปิด [http://localhost:3000/login](http://localhost:3000/login) แล้วเข้าสู่ระบบด้วยบัญชีที่สร้างใน Supabase Auth ระบบไม่มีบัญชีหรือข้อมูลจำลองฝังในหน้าเว็บ เมื่อสร้าง Supabase project แล้ว ให้นำค่า URL และ publishable key ใส่ `.env.local` และรัน migration ทุกไฟล์ใน `supabase/migrations` ตามลำดับ ระบบจะใช้ Supabase Auth, RLS และ Storage จริง หากต้องการเชิญผู้ใช้ใหม่จากหน้า “ผู้ใช้งานและสิทธิ์” ให้เพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ใน `.env.local` (เก็บเฉพาะ server ห้ามใส่ `NEXT_PUBLIC_`)

หลังสร้างผู้ใช้คนแรกใน Supabase Auth แล้ว สามารถรัน [`supabase/seed.sql`](supabase/seed.sql) ใน SQL Editor เพื่อสร้าง workspace, หน่วยงาน, การประชุม, วาระ, รายงาน และ audit entry สำหรับการทดสอบได้ ผู้ใช้คนแรกจะเป็น `admin`; seed ไม่สร้าง Auth user และไม่สร้างไฟล์ปลอมใน Storage ผู้ดูแลระบบสามารถเชิญ role อื่นจากหน้า “ผู้ใช้งานและสิทธิ์” ได้ ผู้ใช้จะได้รับอีเมล กดลิงก์ และตั้งรหัสผ่านของตัวเองที่หน้าเริ่มต้นใช้งาน

การ migrate แบบ SQL Editor ให้รันตามลำดับนี้:

1. `supabase/migrations/202608230001_initial_schema.sql`
2. `supabase/migrations/202608230002_enterprise_workflow.sql`
3. `supabase/migrations/202608240001_operational_actions.sql`
4. `supabase/migrations/202608240002_share_link_resolution.sql`
5. `supabase/seed.sql` (ทำหลังสร้าง Auth user แล้ว)

## คำสั่งสำคัญ

```bash
npm run lint
npm run build
npm run dev
```

## โครงสร้าง

- `src/app/(workspace)` — route ของ dashboard, meetings, reports, documents, members และ audit
- `src/features` — feature modules แยกตามโดเมน ไม่รวมทุกอย่างไว้ในหน้าเดียว
- `src/components` — design-system, layout, search, pagination และ TipTap editor
- `src/app/actions` — Server Actions ที่ตรวจ input ด้วย Zod
- `src/lib/supabase` — Supabase browser/server clients
- `supabase/migrations` — schema, FTS, RLS/RBAC, Storage policies และ audit log
- `docs/SYSTEM_DESIGN.md` — workflow, บทบาท, architecture และแผนพัฒนา
- `.agents/skills/meetflow-product` — Agent Skill สำหรับพัฒนาระบบต่อโดยรักษากติกาผลิตภัณฑ์และภาษาของ UI

## Deployment

เชื่อม GitHub repository กับ Vercel แล้วกำหนด environment variables ตาม `.env.example` การ push ไป branch หลักจะสร้าง production deployment ตาม Vercel Git integration ส่วน pull request จะได้ preview deployment อัตโนมัติ
