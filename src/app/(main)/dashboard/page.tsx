import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getProfile,
  getTodaysWorkout,
  getActiveTrainingPlan,
  getWorkoutsForWeek,
  getWeeklyCheckin,
  getInjuries,
  getWorkoutForDate,
  getNutritionDayForDate,
} from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SessionLogModal } from "@/components/dashboard/SessionLogModal";
import { ModifyWorkoutModal } from "@/components/dashboard/ModifyWorkoutModal";
import { RestDayButton } from "@/components/dashboard/RestDayButton";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { DaySelector } from "@/components/dashboard/DaySelector";
import { AddWorkoutModal } from "@/components/shared/AddWorkoutModal";
import { FuellingCard } from "@/components/dashboard/FuellingCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import {
  getReadinessScore,
  getFuellingPlan,
  getWorkoutWhy,
} from "@/lib/nutrition-intelligence";
import { getDailyIntelligence } from "@/lib/daily-intelligence";
import type { WorkoutType, InjuryStatus } from "@/lib/types";

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  easy: "Easy Run",
  long: "Long Run",
  tempo: "Tempo Run",
  interval: "Intervals",
  strides: "Strides",
  "hill-repeats": "Hill Repeats",
  "cross-training": "Cross Training",
  "recovery-walk": "Recovery Walk",
  rest: "Rest Day",
};

const WORKOUT_TYPE_COLOURS: Record<WorkoutType, string> = {
  easy: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  long: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  tempo: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  interval: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  strides: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  "hill-repeats":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "cross-training":
    "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  "recovery-walk":
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  rest: "bg-muted text-muted-foreground",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
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

function parseSelectedDate(dayParam: string | string[] | undefined): Date {
  if (!dayParam || Array.isArray(dayParam)) return new Date();
  // Expect YYYY-MM-DD
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayParam);
  if (!match) return new Date();
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const READINESS_BANNER: Record<
  "green" | "amber" | "red",
  { bg: string; border: string; text: string; dot: string }
> = {
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-900 dark:text-green-100",
    dot: "bg-green-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-900 dark:text-red-100",
    dot: "bg-red-500",
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Resolve searchParams (Next.js 15+: searchParams is a Promise)
  const resolvedParams = await searchParams;
  const selectedDate = parseSelectedDate(resolvedParams.day);

  const today = new Date();
  const todayStr = toDateString(today);
  const selectedStr = toDateString(selectedDate);
  const isSelectedToday = selectedStr === todayStr;

  // Determine if selected day is past or future relative to today
  const selectedDateNormalized = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );
  const todayNormalized = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const isSelectedPast = selectedDateNormalized < todayNormalized;
  const isSelectedFuture = selectedDateNormalized > todayNormalized;

  const weekStart = getMondayOf(selectedDate);

  // Compute adjacent dates needed for intelligence context
  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(selectedDate);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    profile,
    selectedDayWorkout,
    activePlan,
    weekWorkouts,
    checkin,
    allInjuries,
    tomorrowWorkout,
    yesterdayNutrition,
    todayNutrition,
  ] = await Promise.all([
    getProfile(user.id),
    getTodaysWorkout(user.id, selectedDate),
    getActiveTrainingPlan(user.id),
    getWorkoutsForWeek(user.id, weekStart),
    getWeeklyCheckin(user.id, weekStart),
    getInjuries(user.id),
    getWorkoutForDate(user.id, tomorrow),
    getNutritionDayForDate(user.id, yesterday),
    getNutritionDayForDate(user.id, selectedDate),
  ]);

  // Filter to active injuries only (current or recovering)
  const ACTIVE_STATUSES: InjuryStatus[] = ["current", "recovering"];
  const activeInjuries = allInjuries.filter((i) =>
    ACTIVE_STATUSES.includes(i.status)
  );

  const hasWorkout = selectedDayWorkout !== null;
  const isCompleted = selectedDayWorkout?.completed === true;
  const isRestDay = selectedDayWorkout?.type === "rest";

  // Completed dates for DaySelector
  const completedDates = weekWorkouts
    .filter((w) => w.completed)
    .map((w) => w.date);

  // Scheduled run dates (non-rest, not necessarily completed) for running icon
  const scheduledRunDates = weekWorkouts
    .filter((w) => w.type !== "rest")
    .map((w) => w.date);

  // Readiness
  const readiness = getReadinessScore(checkin);
  const readinessBanner = READINESS_BANNER[readiness.colour];

  // Daily intelligence — only run for today's date
  const intelligence = isSelectedToday && profile
    ? getDailyIntelligence({
        profile,
        todayWorkout: selectedDayWorkout,
        tomorrowWorkout,
        activeInjuries,
        weeklyCheckin: checkin,
        yesterdayNutrition,
        todayNutrition,
        plan: activePlan,
        weekWorkouts,
        currentHour: today.getHours(),
      })
    : null;

  // Limit displayed alerts to top 3 (sorted by severity in getDailyIntelligence)
  const displayedAlerts = intelligence?.alerts.slice(0, 3) ?? [];
  const hiddenAlertCount = (intelligence?.alerts.length ?? 0) - displayedAlerts.length;

  // Fuelling plan — only when there's a non-rest workout
  const userWeight = profile?.weight_kg ?? 70;
  const fuellingPlan =
    hasWorkout && !isRestDay
      ? getFuellingPlan(
          selectedDayWorkout.type,
          selectedDayWorkout.distance_km,
          userWeight
        )
      : null;

  // Why this workout
  const workoutWhy =
    hasWorkout ? getWorkoutWhy(selectedDayWorkout, activePlan) : null;

  // Contextual labels
  const dayName = DAY_NAMES[selectedDate.getDay()];
  const sessionCardTitle = isSelectedToday
    ? "Today's Session"
    : `${dayName}'s Session`;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight">Daily Brief</h1>
        </div>
        <AddWorkoutModal userId={user.id} />
      </div>

      {/* ── Day Selector ── */}
      <DaySelector
        weekStart={weekStart}
        selectedDate={selectedDate}
        completedDates={completedDates}
        scheduledDates={scheduledRunDates}
      />

      {/* ── Section 1: Readiness Banner ── */}
      {checkin ? (
        <div
          className={`rounded-xl border px-4 py-3 ${readinessBanner.bg} ${readinessBanner.border}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${readinessBanner.dot}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-semibold ${readinessBanner.text}`}
                >
                  {intelligence
                    ? `${intelligence.coachingNote.greeting} — ${intelligence.coachingNote.headline}`
                    : readiness.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  Score: {readiness.score}/100
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${readinessBanner.text} opacity-80`}>
                {intelligence
                  ? intelligence.coachingNote.detail
                  : readiness.insight}
              </p>
            </div>
          </div>
          {!intelligence && readiness.factors.length > 0 && (
            <ul className="mt-2 space-y-0.5 pl-5">
              {readiness.factors.map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground list-disc">
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {intelligence
              ? `${intelligence.coachingNote.greeting} — ${intelligence.coachingNote.headline}`
              : "How are you feeling this week?"}
          </p>
          <Link href="/analytics">
            <Button variant="outline" size="sm">
              Check in
            </Button>
          </Link>
        </div>
      )}

      {/* ── Alerts Section (between Readiness Banner and Workout Card) ── */}
      {displayedAlerts.length > 0 && (
        <div className="space-y-2">
          {displayedAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
          {hiddenAlertCount > 0 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              + {hiddenAlertCount} more alert{hiddenAlertCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* ── Section 2: Selected Day's Workout Card ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">{sessionCardTitle}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {activePlan && (
                <Badge variant="outline" className="text-xs">
                  Week {activePlan.current_week} &middot;{" "}
                  {activePlan.current_phase.charAt(0).toUpperCase() +
                    activePlan.current_phase.slice(1)}{" "}
                  Phase
                </Badge>
              )}
              {hasWorkout ? (
                <span
                  className={`inline-flex items-center rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium ${
                    isCompleted
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : WORKOUT_TYPE_COLOURS[selectedDayWorkout.type]
                  }`}
                >
                  {isCompleted
                    ? "Completed"
                    : WORKOUT_TYPE_LABELS[selectedDayWorkout.type]}
                </span>
              ) : (
                <Badge variant="secondary">No session planned</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Workout adjustment banner */}
          {intelligence?.workoutAdjustment && (
            <div
              className={`rounded-lg border px-3 py-2.5 text-xs space-y-0.5 ${
                intelligence.workoutAdjustment.severity === "critical"
                  ? "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              <p className="font-semibold">
                Session modified: {intelligence.workoutAdjustment.original}{" "}
                &rarr; {intelligence.workoutAdjustment.adjusted}
              </p>
              <p className="opacity-80">{intelligence.workoutAdjustment.reason}</p>
            </div>
          )}
          {hasWorkout ? (
            <>
              <div>
                <h3 className="font-semibold text-xl">
                  {intelligence?.workoutAdjustment
                    ? intelligence.workoutAdjustment.adjusted
                    : selectedDayWorkout.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {selectedDayWorkout.duration_minutes} min
                  {selectedDayWorkout.distance_km
                    ? ` · ${selectedDayWorkout.distance_km} km`
                    : ""}
                  {selectedDayWorkout.target_zone
                    ? ` · Zone ${selectedDayWorkout.target_zone}`
                    : ""}
                  {selectedDayWorkout.target_rpe
                    ? ` · RPE ${selectedDayWorkout.target_rpe}`
                    : ""}
                </p>
              </div>

              {selectedDayWorkout.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                      Details
                    </h4>
                    <p className="text-sm">{selectedDayWorkout.description}</p>
                  </div>
                </>
              )}

              {workoutWhy && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                      Why today
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {workoutWhy}
                    </p>
                  </div>
                </>
              )}

              {isCompleted && (
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  Workout completed
                  {selectedDayWorkout.notes ? ` — ${selectedDayWorkout.notes}` : ""}
                  {selectedDayWorkout.actual_duration_minutes
                    ? ` · ${selectedDayWorkout.actual_duration_minutes} min`
                    : ""}
                  {selectedDayWorkout.actual_distance_km
                    ? ` · ${selectedDayWorkout.actual_distance_km} km`
                    : ""}
                </div>
              )}
            </>
          ) : (
            <div className="py-2 text-muted-foreground">
              <p className="text-sm">
                {isSelectedToday
                  ? "No session planned today. Want to log a run?"
                  : isSelectedPast
                  ? `No session was planned for ${dayName}.`
                  : `No session planned for ${dayName} yet.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Pre-Run Fuelling Card (hidden on rest/no workout/completed) ── */}
      {fuellingPlan && fuellingPlan.preRun && !isCompleted && (
        <FuellingCard
          fuellingPlan={fuellingPlan}
          workoutCompleted={false}
        />
      )}

      {/* ── Section 4: Action Buttons ── */}
      <div className="flex gap-2 flex-wrap">
        {/*
          Logic:
          - Future day: no logging — only Modify / Rest Day if workout exists, or Plan a Run if no workout
          - Today/past + has workout + not completed: log against existing workout
          - Today/past + no workout: free-form log or plan
        */}

        {/* Log against an existing workout — today or past only */}
        {hasWorkout && !isCompleted && !isSelectedFuture && (
          <SessionLogModal
            workout={selectedDayWorkout}
            label={isSelectedPast ? "Log Past Session" : undefined}
          />
        )}

        {/* No workout yet — log/plan a run */}
        {!hasWorkout && (
          <AddWorkoutModal
            userId={user.id}
            trigger={
              <Button className="flex-1">
                {isSelectedFuture ? "Plan a Run" : "Log a Run"}
              </Button>
            }
          />
        )}

        {/* Modify — only if workout exists and not completed */}
        {hasWorkout && !isCompleted && (
          <ModifyWorkoutModal workout={selectedDayWorkout} />
        )}

        {/* Rest Day — only if workout exists and not completed and not already a rest day */}
        {hasWorkout && !isCompleted && !isRestDay && (
          <RestDayButton workoutId={selectedDayWorkout.id} />
        )}
      </div>

      {/* ── Section 5: Post-Run Recovery Card — only show if THIS day's workout is completed ── */}
      {isCompleted && fuellingPlan && (
        <FuellingCard
          fuellingPlan={fuellingPlan}
          workoutCompleted={true}
        />
      )}

      {/* Rest day completion state */}
      {isCompleted && isRestDay && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
          <span className="text-base">&#10003;</span>
          <span>Rest day — recovery is where the gains happen.</span>
        </div>
      )}

      {/* ── Section 6: Weekly Calendar Strip ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyCalendar workouts={weekWorkouts} />
        </CardContent>
      </Card>

      {/* ── Tomorrow Preview Footer ── */}
      {intelligence?.tomorrowPreview && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-start gap-2">
          <span className="text-base shrink-0" aria-hidden="true">
            &#128336;
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Tomorrow: </span>
            {intelligence.tomorrowPreview}
          </p>
        </div>
      )}
    </div>
  );
}
