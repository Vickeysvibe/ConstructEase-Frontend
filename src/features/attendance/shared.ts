import { useAuth } from "@/app/auth";
import { today } from "@/lib/format";

/** Today's business date in the organisation's timezone. */
export function useToday() {
  const { session } = useAuth();
  return today(session?.org.timezone);
}

export const attendanceTabs = (to: (p: string) => string) => [
  { to: to("attendance"), label: "Labour", end: true },
  { to: to("attendance/checkins"), label: "Check-ins" },
];
