"use client";

import Link from "next/link";
import { Activity } from "react-feather";
import { cn } from "@/lib/utils";

// Day letter labels Mon–Sun
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface DaySelectorProps {
  weekStart: Date;
  selectedDate: Date;
  completedDates: string[];
  /** Dates that have a non-rest workout scheduled (may or may not be completed) */
  scheduledDates?: string[];
}

export function DaySelector({
  weekStart,
  selectedDate,
  completedDates,
  scheduledDates = [],
}: DaySelectorProps) {
  const today = new Date();
  const todayStr = toDateString(today);
  const selectedStr = toDateString(selectedDate);
  const isSelectedToday = selectedStr === todayStr;

  const completedSet = new Set(completedDates);
  const scheduledSet = new Set(scheduledDates);

  return (
    <div className="space-y-2">
      {/* Day strip — 7 equal columns, no overflow */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LETTERS.map((letter, i) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dateStr = toDateString(dayDate);
            const isSelected = dateStr === selectedStr;
            const isToday = dateStr === todayStr;
            const isPast = dayDate < today && !isToday;
            const isCompleted = completedSet.has(dateStr);
            const hasRun = scheduledSet.has(dateStr) && !isCompleted;

            return (
              <Link
                key={dateStr}
                href={`?day=${dateStr}`}
                className={cn(
                  "flex flex-col items-center justify-center h-14 rounded-xl transition-colors select-none",
                  isSelected
                    ? "bg-foreground text-background"
                    : "bg-muted/50 hover:bg-muted text-foreground",
                  isPast && !isSelected && "opacity-50"
                )}
              >
                <span className="text-[11px] font-medium leading-none">
                  {letter}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold leading-none mt-1",
                    isSelected ? "text-background" : "text-foreground"
                  )}
                >
                  {dayDate.getDate()}
                </span>
                {/* Indicator row */}
                <span className="mt-1 h-2 flex items-center justify-center">
                  {isCompleted ? (
                    <span
                      className={cn(
                        "text-[9px] leading-none",
                        isSelected
                          ? "text-green-300"
                          : "text-green-500 dark:text-green-400"
                      )}
                    >
                      ✓
                    </span>
                  ) : hasRun ? (
                    <Activity
                      size={9}
                      className={cn(
                        isSelected
                          ? "text-background/70"
                          : "text-primary"
                      )}
                      strokeWidth={2.5}
                    />
                  ) : isToday ? (
                    <span
                      className={cn(
                        "inline-block h-1 w-1 rounded-full",
                        isSelected ? "bg-background" : "bg-foreground"
                      )}
                    />
                  ) : null}
                </span>
              </Link>
            );
          })}
      </div>

      {/* "Today" quick-jump when viewing another day */}
      {!isSelectedToday && (
        <div className="flex justify-end">
          <Link
            href={`?day=${todayStr}`}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Jump to today
          </Link>
        </div>
      )}
    </div>
  );
}
