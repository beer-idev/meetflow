# Demo data

ใช้สำหรับ development หรือ staging เท่านั้น บัญชีตัวอย่างทั้งหมดใช้รหัสผ่านเริ่มต้น `12345678`

1. ตรวจสอบ `.env` ให้มี `NEXT_PUBLIC_SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY`
2. ตรวจสอบว่า migrations ทั้งหมดถูก apply แล้ว รวมถึง `202608240003_meeting_modes.sql`
3. รันจากโฟลเดอร์โปรเจกต์:

```powershell
npm.cmd run seed:demo
```

สคริปต์จะสร้างหรืออัปเดตบัญชี Auth, memberships ทุก role, departments, การประชุม Onsite/Online/Hybrid, agenda, reports, permissions และไฟล์ PDF ตัวอย่างใน private Storage ให้พร้อมเปิดและดาวน์โหลดได้จริง

บัญชีที่สร้าง:

| Email | Role |
| --- | --- |
| `admin@gmail.com` | admin |
| `chair@meetflow.local` | chair |
| `reporter@meetflow.local` | reporter |
| `reviewer@meetflow.local` | reviewer |
| `participant@meetflow.local` | participant |
| `staff@meetflow.local` | participant |

หลังทดสอบเสร็จควรเปลี่ยนรหัสผ่านหรือลบผู้ใช้ตัวอย่างก่อนใช้งานจริง
