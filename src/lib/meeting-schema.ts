import { z } from "zod";

export const meetingSchema = z.object({
  title: z.string().trim().min(3, "กรุณาระบุชื่อการประชุมอย่างน้อย 3 ตัวอักษร"),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  startTime: z.string().min(1, "กรุณาเลือกเวลา"),
  meetingMode: z.enum(["onsite", "online", "hybrid"]).default("onsite"),
  location: z.string().trim().optional().default(""),
  onlineUrl: z.string().trim().optional().default(""),
  type: z.enum(["คณะกรรมการ", "ประชุมภายใน", "โครงการ", "ประชุมภายนอก"]),
  description: z.string().trim().max(500, "รายละเอียดต้องไม่เกิน 500 ตัวอักษร").optional(),
}).superRefine((values, context) => {
  if ((values.meetingMode === "onsite" || values.meetingMode === "hybrid") && values.location.trim().length < 2) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["location"], message: "กรุณาระบุสถานที่ประชุม" });
  }
  if ((values.meetingMode === "online" || values.meetingMode === "hybrid") && !/^https?:\/\//i.test(values.onlineUrl.trim())) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["onlineUrl"], message: "กรุณาระบุลิงก์ประชุมที่ขึ้นต้นด้วย http:// หรือ https://" });
  }
});

export type MeetingFormValues = z.input<typeof meetingSchema>;
export type Meeting = MeetingFormValues & {
  id: string;
  status: "upcoming" | "draft" | "published";
  attendeeCount: number;
};
