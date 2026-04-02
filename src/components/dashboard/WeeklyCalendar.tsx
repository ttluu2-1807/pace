import { Activity } from "react-feather";
import type { Workout } from "@/lib/types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Returns Monday of the week containing `date`. */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface Props {
  workouts: Workout[];
}

export function WeeklyCalendar({ workouts }: Props) {
  const today = new Date();
  const monday = getMondayOf(today);
  const todayStr = toDateString(today);

  // Map workouts by date string for O(1) lookup
  const workoutByDate = new Map<string, Workout>();
  for (const w of workouts) {
    workoutByDate.set(w.date, w);
  }

  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {DAY_LABELS.map((label, i) => {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        const dateStr = toDateString(dayDate);
        const workout = workoutByDate.get(dateStr);
        const isToday = dateStr === todayStr;
        const isRun = workout && workout.type !== "rest";

        let dotClass =
          "h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium border ";

        if (workout?.completed) {
          dotClass += "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400";
        } else if (workout) {
          dotClass += "bg-muted border-border text-muted-foreground";
        } else {
          dotClass += "bg-transparent border-dashed border-muted-foreground/30 text-muted-foreground/50";
        }

        if (isToday) {
          dotClass += " ring-2 ring-ring ring-offset-1";
        }

        return (
          <div key={label} className="space-y-1">
            <span className={`text-muted-foreground ${isToday ? "font-semibold text-foreground" : ""}`}>
              {label}
            </span>
            <div className={dotClass} title={workout?.title ?? "No workout"}>
              {isRun ? (
                <Activity
                  size={13}
                  strokeWidth={2}
                  className={
                    workout?.completed
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }
                />
              ) : workout?.type === "rest" ? (
                <span className="text-[10px]">R</span>
              ) : (
                <span className="text-[10px]">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
