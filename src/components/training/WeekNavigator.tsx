"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WeekNavigatorProps {
  currentWeekStart: Date
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toDateParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateLabel(start: Date, end: Date): string {
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()

  const startDay = SHORT_DAYS[start.getDay()]
  const endDay = SHORT_DAYS[end.getDay()]

  const startMonth = SHORT_MONTHS[start.getMonth()]
  const endMonth = SHORT_MONTHS[end.getMonth()]

  const startStr = `${startDay} ${start.getDate()} ${startMonth}`

  // Include year on the end date only if years differ
  const endStr =
    startYear !== endYear
      ? `${endDay} ${end.getDate()} ${endMonth} ${endYear}`
      : `${endDay} ${end.getDate()} ${endMonth}`

  return `${startStr} – ${endStr}`
}

export function WeekNavigator({ currentWeekStart }: WeekNavigatorProps) {
  const todayMonday = getMondayOf(new Date())
  const todayParam = toDateParam(todayMonday)

  // The week this component is showing
  const weekStart = new Date(currentWeekStart)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const prevWeek = new Date(weekStart)
  prevWeek.setDate(prevWeek.getDate() - 7)

  const nextWeek = new Date(weekStart)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const isCurrentWeek = toDateParam(weekStart) === todayParam

  const dateRangeLabel = formatDateLabel(weekStart, weekEnd)

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      {/* Prev link */}
      <Link
        href={`?week=${toDateParam(prevWeek)}`}
        prefetch={false}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Prev
      </Link>

      {/* Centre: date range + optional badge */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-medium">
          {dateRangeLabel}
        </span>
        {isCurrentWeek && (
          <Badge variant="secondary" className="text-xs">
            This Week
          </Badge>
        )}
      </div>

      {/* Right: optional Today link + Next link */}
      <div className="flex items-center gap-1">
        {!isCurrentWeek && (
          <Link
            href="?"
            prefetch={false}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Today
          </Link>
        )}
        <Link
          href={`?week=${toDateParam(nextWeek)}`}
          prefetch={false}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Next →
        </Link>
      </div>
    </div>
  )
}
