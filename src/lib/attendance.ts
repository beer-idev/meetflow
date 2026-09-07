import "server-only";

import { cache } from "react";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicAttendanceMeeting = {
  id: string;
  title: string;
  meetingDate: string;
  startTime: string;
  endTime: string | null;
  location: string;
  meetingMode: "onsite" | "online" | "hybrid";
  organizationName: string;
};

export const getPublicAttendanceMeeting = cache(async (meetingId: string): Promise<PublicAttendanceMeeting | null> => {
  if (!z.string().uuid().safeParse(meetingId).success) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("meetings")
      .select("id,title,meeting_date,start_time,end_time,location,meeting_mode,status,organizations(name)")
      .eq("id", meetingId)
      .maybeSingle();
    if (!data || data.status === "cancelled") return null;
    const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
    return {
      id: data.id,
      title: data.title,
      meetingDate: data.meeting_date,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location,
      meetingMode: data.meeting_mode ?? "onsite",
      organizationName: organization?.name ?? "MeetFlow",
    };
  } catch {
    return null;
  }
});

