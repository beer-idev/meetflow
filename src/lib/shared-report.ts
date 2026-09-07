export type SharedAgendaItem = {
  position: number;
  title: string;
  detail: string | null;
  resolution: string | null;
};

export type SharedParticipant = {
  name: string;
  attendance_status: string;
  role?: string;
  label?: string;
};

export type SharedReport = {
  meeting_id: string;
  title: string;
  meeting_type: string;
  description: string | null;
  meeting_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  meeting_mode: "onsite" | "online" | "hybrid";
  online_url: string | null;
  report_text: string | null;
  report_status: "draft" | "in_review" | "approved" | "published" | null;
  prepared_by: string;
  expires_at: string;
  agenda: SharedAgendaItem[];
  participants: SharedParticipant[];
};

export function formatSharedDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatSharedDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatSharedTime(value: string | null) {
  return value ? value.slice(0, 5) : "-";
}
